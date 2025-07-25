import LeaveApplication from "../models/LeaveApplication.js";
import Faculty from "../models/Faculty.js";
import Student from "../models/Student.js";


export const submitLeaveApplication = async (req, res) => {
  try {
    const {
      reason,
      fromDate,
      toDate,
      leaveType,
      currentAttendance,
      attendanceAfterLeave,
    } = req.body;

    const documents = req.files?.map((file) => file.path); // cloudinary URLs

    if (!reason || !fromDate || !toDate || !leaveType) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    // 🔍 Get student info from DB to access department and section
    const student = await Student.findById(req.user._id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const newLeave = await LeaveApplication.create({
      student: req.user._id,
      reason,
      fromDate,
      toDate,
      leaveType,
      currentAttendance,
      attendanceAfterLeave,
      documents: documents || [],
    });

    // 🧠 Get Socket.IO instance
    const io = req.app.get('io');

    // 📢 Notify faculty in the same department-section room (e.g., "CSE-A")
    const roomName = `${student.department}-${student.section}`;
    console.log('room value',roomName)
    io.to(roomName).emit("leaveSubmitted", {
      message: `New leave application from ${student.name}`,
  
      leave: newLeave,
    });

    res.status(201).json({
      message: "Leave application submitted successfully.",
      application: newLeave,
    });
  } catch (error) {
    console.error("Submit Leave Error:", error);
    res.status(500).json({ message: "Server error while submitting leave" });
  }
};



/*------------------------------only for the user -------------------------------*/
export const getMyApplications = async (req, res) => {
  try {
    const statusFilter = req.query.status; // ?status=approved

    // Step 1: Start with a base query to match the current logged-in user
    const query = {
      student: req.user._id, // Only this user's applications
    };

    // Step 2: If status is passed, add it to the query
    if (statusFilter) {
      query.finalStatus = statusFilter; // This will only match approved/rejected/etc.
    }

    // Step 3: Find from DB with optional filtering
    const applications = await LeaveApplication.find(query)
      .populate("student", "name rollNumber department") // optional, useful for display
      .sort({ createdAt: -1 }); // latest first

    res.status(200).json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getLeaveById = async (req, res) => {

  try {

    const leave = await LeaveApplication.findById(req.params.id).populate('student');
    console.log('hey i got called')
    res.json(leave)
  } catch (error) {
    console.error("❌ Error fetching leave by ID:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
}

// Controller: getAllStudentLeaves.js
export const getAllStudentLeaves = async (req, res) => {
  try {
    const user = req.user; // Contains logged-in user info
    const leaves = await LeaveApplication.find().populate("student");
    
    const groupedLeaves = {
      pending: [],
      approved: [],
      rejected: [],
    };

    for (const leave of leaves) {
      // 🧠 Faculty can only see if department/section match
      if (user.role === "faculty") {
        const status = leave.decisionBy.faculty.status;
        if (
          leave.student.department === user.department &&
          leave.student.section === user.section &&
          groupedLeaves.hasOwnProperty(status)
        ) {
          groupedLeaves[status].push(leave);
        }
      }

      // 🧠 HOD can only see if faculty approved
      else if (user.role === "hod") {
        const status = leave.decisionBy.hod.status;
        if (
          leave.student.department === user.department &&
          leave.decisionBy.faculty.status === "approved" &&
          groupedLeaves.hasOwnProperty(status)
        ) {
          groupedLeaves[status].push(leave);
        }
      }

      // 🧠 Warden can only see if HOD approved
      else if (user.role === "warden") {
        const status = leave.decisionBy.warden.status;
        if (
          leave.decisionBy.faculty.status === "approved" &&
          leave.decisionBy.hod.status === "approved" &&
          groupedLeaves.hasOwnProperty(status)
        ) {
          groupedLeaves[status].push(leave);
        }
      }

      // 🧠 Admin sees all (optional)
      else if (user.role === "admin") {
        const status = leave.finalStatus;
        if (groupedLeaves.hasOwnProperty(status)) {
          groupedLeaves[status].push(leave);
        }
      }
    }

    res.status(200).json(groupedLeaves);
  } catch (error) {
    console.error("Error fetching leaves:", error.message);
    res.status(500).json({ error: "Something went wrong while fetching leaves." });
  }
};



export const actionOnLeave = async (req, res) => {
  const { appId, status, comment, decidedAt } = req.body;
  const role = req.user.role;
  const department=req.user.department;
  if (role !== "student") {
    try {
      const updateField = {
        [`decisionBy.${role}.status`]: status,
        [`decisionBy.${role}.comment`]: comment,
        [`decisionBy.${role}.decidedAt`]: decidedAt,
      };
     // Set final status based on role and decision
      if (role === 'warden' && status === "approved") {
        updateField.finalStatus = "approved";
      } else if (role === 'warden'&&status === "rejected") {
        updateField.finalStatus = "rejected";
      }

      // Update the leave application
      await LeaveApplication.findByIdAndUpdate(appId, { $set: updateField });

      // Populate student after update
      const updatedLeave = await LeaveApplication.findById(appId).populate("student");
 
      if (!updatedLeave) {
        return res.status(404).json({ message: "Leave application not found." });
      }

      // Access io instance
      const io = req.app.get("io");

      // Get student details
      const student = updatedLeave.student;
      const studentRoom = `${student.department}-${student.section}-${student.id}`;

      console.log("🔔 Emitting to student room:", studentRoom);

      // Emit to specific student
      io.to(studentRoom).emit("leaveStatusUpdated", updatedLeave);

      // 🔔 If current role is faculty and status is approved → Notify HODs
      if (role === "faculty" && department==student.department && status === "approved") {
        const hodRoom = `hod-${student.department}`;
        console.log("📢 Emitting to HOD room:", hodRoom);
        io.to(hodRoom).emit("facultyApprovedLeave", updatedLeave); // you can handle this event on HOD dashboard
      }
      if(role=="hod" && status==="approved"){
        const wardenRoom=`warden-${student.hostel.name}`;
        io.to(wardenRoom).emit("hodApprovedLeave", updatedLeave); // you can handle this event on WARDEN dashboard
      }

      res.status(200).json(updatedLeave);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(403).json({ message: "Access denied. Students cannot perform this action." });
  }
};

