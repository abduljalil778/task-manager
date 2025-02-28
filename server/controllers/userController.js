import asyncHandler from "express-async-handler";
import Notice from "../models/notis.js";
import User from "../models/userModel.js";
import createJWT from "../utils/index.js";

class UserController {
  // Login user
  loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ status: false, message: "Invalid email or password." });
    }

    if (!user.isActive) {
      return res.status(401).json({
        status: false,
        message: "User account has been deactivated, contact the administrator.",
      });
    }

    const isMatch = await user.matchPassword(password);

    if (user && isMatch) {
      createJWT(res, user._id);
      user.password = undefined;

      res.status(200).json(user);
    } else {
      return res.status(401).json({ status: false, message: "Invalid email or password" });
    }
  });

  // Register a new user
  registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, isAdmin, role, title } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ status: false, message: "Email address already exists." });
    }

    const user = await User.create({
      name,
      email,
      password,
      isAdmin,
      role,
      title,
    });

    if (user) {
      if (isAdmin) createJWT(res, user._id);

      user.password = undefined;
      res.status(201).json(user);
    } else {
      return res.status(400).json({ status: false, message: "Invalid user data." });
    }
  });

  // Logout user
  logoutUser = (req, res) => {
    res.cookie("token", "", {
      httpOnly: true,
      expires: new Date(0),
    });
    res.status(200).json({ message: "Logged out successfully." });
  };

  // Get team list
  getTeamList = asyncHandler(async (req, res) => {
    const { search } = req.query;
    let query = {};

    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { name: { $regex: search, $options: "i" } },
          { role: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      };
    }

    const users = await User.find(query).select("name title role email isActive");

    res.status(200).json(users);
  });

  // Get user notifications
  getNotificationsList = asyncHandler(async (req, res) => {
    const { userId } = req.user;

    const notices = await Notice.find({
      team: userId,
      isRead: { $nin: [userId] },
    })
      .populate("task", "title")
      .sort({ _id: -1 });

    res.status(200).json(notices);
  });

  // Update user profile
  updateUserProfile = asyncHandler(async (req, res) => {
    const { userId, isAdmin } = req.user;
    const { _id, name, title, role } = req.body;

    const id = isAdmin && userId === _id ? userId : isAdmin && userId !== _id ? _id : userId;

    const user = await User.findById(id);

    if (user) {
      user.name = name || user.name;
      user.title = title || user.title;
      user.role = role || user.role;

      const updatedUser = await user.save();

      updatedUser.password = undefined;

      res.status(200).json({
        status: true,
        message: "Profile updated successfully.",
        user: updatedUser,
      });
    } else {
      res.status(404).json({ status: false, message: "User not found." });
    }
  });

  // Activate or deactivate user profile
  activateUserProfile = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(id);

    if (user) {
      user.isActive = req.body.isActive;
      await user.save();

      user.password = undefined;

      res.status(200).json({
        status: true,
        message: `User account has been ${user.isActive ? "activated" : "deactivated"}.`,
      });
    } else {
      res.status(404).json({ status: false, message: "User not found." });
    }
  });

  // Change user password
  changeUserPassword = asyncHandler(async (req, res) => {
    const { userId } = req.user;

    const user = await User.findById(userId);

    if (user) {
      user.password = req.body.password;
      await user.save();

      user.password = undefined;

      res.status(200).json({ status: true, message: "Password changed successfully." });
    } else {
      res.status(404).json({ status: false, message: "User not found." });
    }
  });

  // Delete user profile
  deleteUserProfile = asyncHandler(async (req, res) => {
    const { id } = req.params;

    await User.findByIdAndDelete(id);

    res.status(200).json({ status: true, message: "User deleted successfully." });
  });
}

export default UserController;
