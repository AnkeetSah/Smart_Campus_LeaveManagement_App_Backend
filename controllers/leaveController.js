import LeaveApplication from "../models/LeaveApplication.js";
import Faculty from "../models/Faculty.js";

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

    // ✅ Get Cloudinary file URLs from uploaded documents
    const documents = req.files?.map((file) => file.path); // .path contains Cloudinary URL

    // Basic validation
    if (!reason || !fromDate || !toDate || !leaveType) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    const newLeave = await LeaveApplication.create({
      student: req.user._id,
      reason,
      fromDate,
      toDate,
      leaveType,
      currentAttendance,
      attendanceAfterLeave,
      documents: documents || [], // ✅ use uploaded file URLs
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

  if (role !== "student") {
    try {
      const updateField = {
        [`decisionBy.${role}.status`]: status,
        [`decisionBy.${role}.comment`]: comment,
        [`decisionBy.${role}.decidedAt`]: decidedAt,
      };

      const updatedLeave = await LeaveApplication.findByIdAndUpdate(
        appId,
        { $set: updateField },
        { new: true, runValidators: true }
      );

      if (!updatedLeave) {
        return res.status(404).json({ message: "Leave application not found." });
      }

      res.status(200).json(updatedLeave);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(403).json({ message: "Access denied. Students cannot perform this action." });
  }
};


