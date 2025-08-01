import Faculty from "../models/Faculty.js";
import Subscription from "../models/subscriptionModel.js";
import webpush from '../config/pushConfig.js';
/*export const notifyFacultyOnLeaveSubmit = (app, student, leave) => {
  const io = app.get("io");
  const room = `${student.branch}-${student.section}`;
  console.log("room value", room);

  io.to(room).emit("leaveSubmitted", {
    message: `New leave application from ${student.name}`,
    leave,
  });
};
*/
export const notifyFacultyOnLeaveSubmit = async (app, student, leave) => {
  const io = app.get("io");
  const room = `${student.branch}-${student.section}`;
  console.log("room value", room);

  // Emit to the specific room for the student's branch and section
  io.to(room).emit("leaveSubmitted", {
    message: `New leave application from ${student.name}`,
    leave,
  });


  const faculty= await Faculty.find({ branch: student.branch, section: student.section });
  const subscriber= await Subscription.find({
    userId: { $in: faculty.map(f => f._id) },
  });

  console.log("subscriber", subscriber);
  if (subscriber.length > 0) {
    const payload = {
  title: "New Leave Application",
  message: `New leave application from ${student.name}`,
  data: {
    url: `http://localhost:5173/authority/dashboard`, // URL to redirect on click
    leaveId: leave._id,
    studentId: student._id,
  },
};


    // Emit to all subscribers
   subscriber.forEach(sub => {
   webpush.sendNotification(sub.subscription, JSON.stringify(payload))
    .catch(error => console.error("Push error", error));
});
  }
};
