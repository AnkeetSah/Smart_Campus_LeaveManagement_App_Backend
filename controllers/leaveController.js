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




export const actionOnLeave = async (req, res) => {
  const { appId, status, comment, decidedAt } = req.body;
  const role = req.user.role;
  
  const branch = req.user.toObject().branch;
  if (role !== "student") {
    try {
      const updateField = {
        [`decisionBy.${role}.status`]: status,
        [`decisionBy.${role}.comment`]: comment,
        [`decisionBy.${role}.decidedAt`]: decidedAt,
      };

      // ✅ Set finalStatus = "rejected" if any role rejects
      if (status === "rejected") {
        updateField.finalStatus = "rejected";
      }

      // ✅ If WARDEN approves, finalStatus becomes approved
      if (role === 'warden' && status === "approved") {
        updateField.finalStatus = "approved";
      }

      // 🔧 Update the leave application in DB
      await LeaveApplication.findByIdAndUpdate(appId, { $set: updateField });

      // 🔄 Fetch updated leave with student populated
      const updatedLeave = await LeaveApplication.findById(appId).populate("student");
      if (!updatedLeave) {
        return res.status(404).json({ message: "Leave application not found." });
      }
      
      // 📡 Get socket instance and student room
      const io = req.app.get("io");
      const student = updatedLeave.student;
    
      const studentRoom = `${student.branch}-${student.section}-${student.id}`;
      console.log('student room is ',studentRoom)
      // 🚀 Always emit update to student
      io.to(studentRoom).emit("leaveStatusUpdated", updatedLeave);
        console.log('student id',student.id)
      /*----------------------Push Notification to the student here--------------------------*/
            const studentSubscriber= await Subscription.find({
                 userId:student.id
            })

            console.log('SUbscribed user',studentSubscriber)

            if(studentSubscriber.length>0){
              const payload={
                title:"Leave application Update",
                message:`You have a new update on your leave ${updatedLeave.reason}`,
                data:{
                  url:`${frontendURL}/dashboard/student`,
                  leaveId:updatedLeave._id
                }
                              }

                //Emit to all the subscriber
               studentSubscriber.forEach(sub => {
                  webpush.sendNotification(sub.subscription, JSON.stringify(payload))
                   .catch(error => console.error("Push error", error));
               });
            }

      // ❌ If rejected, do not emit to other roles
      if (status === "rejected") {
        return res.status(200).json(updatedLeave);
      }

      
        
      // ✅ Else, based on role and approval, emit to next authority
      if (role === "faculty" && branch === student.branch && status === "approved") {
        const hodRoom = `hod-${student.branch}`;
        console.log('hodRoom is',hodRoom)
        io.to(hodRoom).emit("facultyApprovedLeave", updatedLeave);

        const hod=await Hod.find({
          branch:student.branch
        })
        
        const hodSubscription= await Subscription.find({
          userId: { $in: hod.map(h=> h._id) },
        })
        console.log('hod subscription',hodSubscription)

          const payload = {
  title: "New Leave Application",
  message: `New leave application from ${student.name}`,
  data: {
    url: `${frontendURL}/authority/dashboard`,// URL to redirect on click
    leaveId: updatedLeave._id,
    studentId: student._id,
  },
};

 // Emit to all subscribers
   hodSubscription.forEach(sub => {
   webpush.sendNotification(sub.subscription, JSON.stringify(payload))
    .catch(error => console.error("Push error", error));
});
      }

      if (role === "hod" && status === "approved") {
        const wardenRoom = `warden-${student.hostel.name}`;
        io.to(wardenRoom).emit("hodApprovedLeave", updatedLeave);

        const warden=await  Warden.find({
             hostel: student.hostel.name
        })
       
        const wardenSubscription= await Subscription.find({
          userId:{$in:warden.map(w=>w._id)}
        })
        const payload = {
  title: "New Leave Application",
  message: `New leave application from ${student.name}`,
  data: {
    url: `${frontendURL}/authority/dashboard`,// URL to redirect on click
    leaveId: updatedLeave._id,
    studentId: student._id,
  },
};
   wardenSubscription.forEach(sub => {
      webpush.sendNotification(sub.subscription, JSON.stringify(payload))
       .catch(error => console.error("Push error", error));
   });

      }

      res.status(200).json(updatedLeave);
    } catch (error) {
      console.error("❌ Error in actionOnLeave:", error.message);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(403).json({ message: "Access denied. Students cannot perform this action." });
  }
};


