export const notifyFacultyOnLeaveSubmit = (app, student, leave) => {
  const io = app.get("io");
  const room = `${student.department}-${student.section}`;
  console.log("room value", room);

  io.to(room).emit("leaveSubmitted", {
    message: `New leave application from ${student.name}`,
    leave,
  });
};
