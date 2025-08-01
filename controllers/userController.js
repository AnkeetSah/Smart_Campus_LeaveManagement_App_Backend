export const getMe = async (req, res) => {
  try {
    const user = req.user; 
   
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Not authorized" });
  }
};
