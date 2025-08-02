import LeaveApplication from "../models/LeaveApplication.js";
import Faculty from "../models/Faculty.js";
import Student from "../models/Student.js";
import Hod from '../models/Hod.js'
import Warden from '../models/Warden.js'
import webpush from "../config/pushConfig.js";
import Subscription from "../models/subscriptionModel.js";
const isProduction = process.env.NODE_ENV === 'production';

const frontendURL = isProduction
  ? 'https://leaveflow.netlify.app' // hosted app URL
  : 'http://localhost:5173';        // local dev URL



import { createLeaveApplication,getApplicationsByStudent,getLeaveApplicationById ,getGroupedLeavesForUser } from "../services/leave.service.js";
import { notifyFacultyOnLeaveSubmit } from "../services/notification.service.js";

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
    const leave = await getLeaveApplicationById(req.params.id);
    res.status(200).json(leave);
  } catch (error) {
    console.error("❌ Error fetching leave by ID:", error.message);
    res.status(500).json({ message: error.message || "Server Error" });
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

export const actionOnLeave = async (req, res) => {
  const { appId, status, comment, decidedAt } = req.body;
  const { role } = req.user;
  const branch = req.user.toObject().branch;

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

