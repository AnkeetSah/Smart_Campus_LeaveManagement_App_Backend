import LeaveApplication from "../models/LeaveApplication.js";
import Student from "../models/Student.js";

export const createLeaveApplication = async (user, body, files) => {
  const {
    reason,
    fromDate,
    toDate,
    leaveType,
    currentAttendance,
    attendanceAfterLeave,
  } = body;

  const documents = files?.map((file) => file.path) || [];

  if (!reason || !fromDate || !toDate || !leaveType) {
    throw new Error("Please fill all required fields");
  }

  const student = await Student.findById(user._id);
  if (!student) {
    throw new Error("Student not found");
  }

  const application = await LeaveApplication.create({
    student: user._id,
    reason,
    fromDate,
    toDate,
    leaveType,
    currentAttendance,
    attendanceAfterLeave,
    documents,
  });

  return { application, student };
};


export const getApplicationsByStudent = async (studentId, statusFilter) => {
  const query = { student: studentId };

  if (statusFilter) {
    query.finalStatus = statusFilter;
  }

  const applications = await LeaveApplication.find(query)
    .populate("student", "name rollNumber department")
    .sort({ createdAt: -1 });

  return applications;
};


export const getLeaveApplicationById = async (id) => {
  const leave = await LeaveApplication.findById(id).populate("student");
  if (!leave) {
    throw new Error("Leave application not found");
  }
  return leave;
};






export const getGroupedLeavesForUser = async (user) => {
  const leaves = await LeaveApplication.find().populate("student");

  const groupedLeaves = {
    pending: [],
    approved: [],
    rejected: [],
  };

  for (const leave of leaves) {
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

    else if (user.role === "admin") {
      const status = leave.finalStatus;
      if (groupedLeaves.hasOwnProperty(status)) {
        groupedLeaves[status].push(leave);
      }
    }
  }

  return groupedLeaves;
};
