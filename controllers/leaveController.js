import LeaveApplication from "../models/LeaveApplication.js";
import Faculty from "../models/Faculty.js";
import Student from "../models/Student.js";
import Hod from '../models/Hod.js'
import Warden from '../models/Warden.js'
import webpush from "../config/pushConfig.js";
import Subscription from "../models/subscriptionModel.js";
import Guard from "../models/Guard.js";
const isProduction = process.env.NODE_ENV === 'production';

const frontendURL = isProduction
  ? 'https://leaveflow.netlify.app' // hosted app URL
  : 'http://localhost:5173';        // local dev URL



import { createLeaveApplication, getApplicationsByStudent, getLeaveApplicationById, getGroupedLeavesForUser } from "../services/leave.service.js";
import { notifyFacultyOnLeaveSubmit } from "../services/notification.service.js";
// 🔧 Helper to send web push notifications to all subscribers
const sendPushToSubscribers = (subscribers, payload) => {
  subscribers.forEach(sub =>
    webpush.sendNotification(sub.subscription, JSON.stringify(payload))
      .catch(err => console.error("Push error", err))
  );
};

// 🔧 Helper to get user subscriptions
const getUserSubscriptions = async (userIds) => {
  return Subscription.find({ userId: { $in: userIds } });
};

// 🔧 Emit socket event
const emitSocketEvent = (io, room, event, data) => {
  io.to(room).emit(event, data);
};


export const submitLeaveApplication = async (req, res) => {
  try {
    const { application, student } = await createLeaveApplication(req.user, req.body, req.files);

    // Emit socket notification
    notifyFacultyOnLeaveSubmit(req.app, student, application);

    res.status(201).json({
      message: "Leave application submitted successfully.",
      application,
    });
  } catch (error) {
    console.error("Submit Leave Error:", error);
    res.status(500).json({ message: error.message || "Server error while submitting leave" });
  }
};




/*------------------------------only for the user -------------------------------*/

export const getMyApplications = async (req, res) => {
  try {
    const applications = await getApplicationsByStudent(req.user._id, req.query.status);
    res.status(200).json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};


export const getLeaveById = async (req, res) => {
  try {
    console.log("hey", req.user);

    const guardData = await Guard.findById(req.user._id);
    if (!guardData) {
      return res.status(404).json({ message: "Guard not found" });
    }

    const leave = await getLeaveApplicationById(req.params.id);

    // Check if this leaveId is already in scannedLeaves
    const existingLeave = guardData.scannedLeaves.find(
      (item) => item.leaveId.toString() === leave._id.toString()
    );

    if (existingLeave) {
      // Increment count and update last scanned time
      existingLeave.count += 1;
      existingLeave.lastScannedAt = Date.now();
    } else {
      // Add new entry for this leaveId
      guardData.scannedLeaves.push({
        leaveId: leave._id,
        count: 1,
        lastScannedAt: Date.now()
      });
    }

    await guardData.save();

    console.log("leave by id got called");
    res.status(200).json(leave);

  } catch (error) {
    console.error("❌ Error fetching leave by ID:", error.message);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};



export const updateLeaveApplication = async (req, res) => {
  try {
    console.log(req.user)
    const id = req.params.id;

    const application = await LeaveApplication.findById(id).populate("student");
    if (!application) {
      return res.status(404).json({ message: "Leave application not found" });
    }

    const {
      reason,
      fromDate,
      toDate,
      leaveType,
      currentAttendance,
      attendanceAfterLeave,
      addressDuringLeave
    } = req.body;

    const documents = req.files?.map((file) => file.path) || [];

    // Update fields
    application.reason = reason;
    application.fromDate = fromDate;
    application.toDate = toDate;
    application.leaveType = leaveType;
    application.currentAttendance = currentAttendance;
    application.attendanceAfterLeave = attendanceAfterLeave;
    application.addressDuringLeave = addressDuringLeave;

    if (documents.length > 0) {
      application.documents = documents;
    }
    const io = req.app.get("io")
    // Reset decisionBy for roles with "changes_requested"
    for (const role in application.decisionBy) {
      if (application.decisionBy[role].status === "changes_requested") {

        application.decisionBy[role].status = "pending";
        application.decisionBy[role].comment = "";
        await application.save();
        if (role == "faculty") {
          const room = `${application.student.branch}-${application.student.section}`
          io.to(room).emit("updatedLeave", {
            message: `Updated leave application from ${application.student.name}`,
            application,
          });


          const faculty = await Faculty.find({ branch: application.student.branch, section: application.student.section });
          const subscriber = await Subscription.find({
            userId: { $in: faculty.map(f => f._id) },
          });


          if (subscriber.length > 0) {
            const payload = {
              title: "Updated Leave Application",
              message: `Updated leave application from ${application.student.name}`,
              data: {
                url: `${frontendURL}/authority/dashboard`,// URL to redirect on click
                leaveId: application._id,
                studentId: application.student._id,
              },
            };


            // Emit to all subscribers
            subscriber.forEach(sub => {
              webpush.sendNotification(sub.subscription, JSON.stringify(payload))
                .catch(error => console.error("Push error", error));
            });
          }
        }

        if (role == "warden") {
          const wardenRoom = `warden-${application.student.hostel.name}`
          const data = { message: `Updated leave application from ${application.student.name}` }
          emitSocketEvent(io, wardenRoom, 'updatedLeave', data)
           const wardens = await Warden.find({ hostel: application.student.hostel.name })
          const wardenSubs = await getUserSubscriptions(wardens.map(h => h._id));

          if (wardenSubs.length) {
            sendPushToSubscribers(wardenSubs, {
              title: "Updated Leave Application",
              message: `Updated leave application from ${application.student.name}`,
              data: {
                url: `${frontendURL}/authority/dashboard`,// URL to redirect on click
                leaveId: application._id,
                studentId: application.student._id,
              },
            });
          }
        }

        if (role == "hod") {
          const hodRoom = `hod-${application.student.branch}`
          const data = { message: `Updated leave application from ${application.student.name}` }
          emitSocketEvent(io, hodRoom, 'updatedLeave', data)
          const hods = await Warden.find({ branch: application.student.branch });
          const hodSubs = await getUserSubscriptions(hods.map(h => h._id));

          if (hodSubs.length) {
            sendPushToSubscribers(hodSubs, {
              title: "Updated Leave Application",
              message: `Updated leave application from ${application.student.name}`,
              data: {
                url: `${frontendURL}/authority/dashboard`,// URL to redirect on click
                leaveId: application._id,
                studentId: application.student._id,
              },
            });
          }
        }



      }
    }

    // await application.save();

    res.status(200).json({ message: "Leave Updated Successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



// Controller: getAllStudentLeaves.js
export const getAllStudentLeaves = async (req, res) => {
  try {
    const groupedLeaves = await getGroupedLeavesForUser(req.user);
    res.status(200).json(groupedLeaves);
  } catch (error) {
    console.error("Error fetching leaves:", error.message);
    res.status(500).json({ error: error.message || "Something went wrong while fetching leaves." });
  }
};






export const actionOnLeave = async (req, res) => {
  const { appId, status, comment, decidedAt } = req.body;
  const { role } = req.user;
  const branch = req.user.toObject().branch;
  console.log(status, comment)
  if (role === "student") {
    return res.status(403).json({ message: "Access denied. Students cannot perform this action." });
  }

  try {
    // ⚙️ Prepare fields to update
    const updateField = {
      [`decisionBy.${role}.status`]: status,
      [`decisionBy.${role}.comment`]: comment,
      [`decisionBy.${role}.decidedAt`]: decidedAt,
    };



    if (status === "rejected") updateField.finalStatus = "rejected";
    if (role === "warden" && status === "approved") updateField.finalStatus = "approved";

    // 🔄 Update leave status in DB
    await LeaveApplication.findByIdAndUpdate(appId, { $set: updateField });



    // 📥 Fetch updated leave with student details
    const updatedLeave = await LeaveApplication.findById(appId).populate("student");
    if (!updatedLeave) return res.status(404).json({ message: "Leave application not found." });

    const student = updatedLeave.student;
    const io = req.app.get("io");

    // 📡 Notify the student via socket
    const studentRoom = `${student.branch}-${student.section}-${student.id}`;
    emitSocketEvent(io, studentRoom, "leaveStatusUpdated", updatedLeave);

    // 📬 Send push notification to student
    const studentSubs = await getUserSubscriptions([student.id]);
    if (studentSubs.length) {
      sendPushToSubscribers(studentSubs, {
        title: "Leave Application Update",
        message: `Update on your leave: ${updatedLeave.reason}`,
        data: {
          url: `${frontendURL}/dashboard/student`,
          leaveId: updatedLeave._id,
        },
      });
    }

    // ❌ If rejected, no further propagation
    if (status === "rejected") return res.status(200).json(updatedLeave);

    // ✅ If approved, send to next authority
    if (role === "faculty" && status === "approved" && branch === student.branch) {
      const hodRoom = `hod-${student.branch}`;
      emitSocketEvent(io, hodRoom, "facultyApprovedLeave", updatedLeave);

      const hods = await Hod.find({ branch: student.branch });
      const hodSubs = await getUserSubscriptions(hods.map(h => h._id));
      if (hodSubs.length) {
        sendPushToSubscribers(hodSubs, {
          title: "New Leave Application",
          message: `New leave application from ${student.name}`,
          data: {
            url: `${frontendURL}/authority/dashboard`,
            leaveId: updatedLeave._id,
            studentId: student._id,
          },
        });
      }
    }

    if (role === "hod" && status === "approved") {
      const wardenRoom = `warden-${student.hostel.name}`;
      emitSocketEvent(io, wardenRoom, "hodApprovedLeave", updatedLeave);

      const wardens = await Warden.find({ hostel: student.hostel.name });
      const wardenSubs = await getUserSubscriptions(wardens.map(w => w._id));
      if (wardenSubs.length) {
        sendPushToSubscribers(wardenSubs, {
          title: "New Leave Application",
          message: `New leave application from ${student.name}`,
          data: {
            url: `${frontendURL}/authority/dashboard`,
            leaveId: updatedLeave._id,
            studentId: student._id,
          },
        });
      }
    }

    res.status(200).json(updatedLeave);
  } catch (error) {
    console.error("❌ Error in actionOnLeave:", error);
    res.status(500).json({ error: error.message });
  }
};

