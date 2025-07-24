export const getMe = async (req, res) => {
  try {
    const user = req.user; 
 
    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      section:user.section,
      semesterStartDate:user.semesterStartDate,
      semesterEndDate:user.semesterEndDate,
    });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Not authorized" });
  }
};
