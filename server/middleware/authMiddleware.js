import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

class AuthMiddleware {
  // Middleware to protect routes
  protectRoute = asyncHandler(async (req, res, next) => {
    let token = req.cookies.token;

    if (token) {
      try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decodedToken.userId).select("isAdmin email");

        if (!user) {
          return res.status(401).json({
            status: false,
            message: "User not found. Try login again.",
          });
        }

        req.user = {
          email: user.email,
          isAdmin: user.isAdmin,
          userId: decodedToken.userId,
        };

        next();
      } catch (error) {
        console.error(error);
        return res.status(401).json({
          status: false,
          message: "Not authorized. Try login again.",
        });
      }
    } else {
      return res.status(401).json({
        status: false,
        message: "Not authorized. Try login again.",
      });
    }
  });

  // Middleware to check admin routes
  isAdminRoute = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
      next();
    } else {
      return res.status(401).json({
        status: false,
        message: "Not authorized as admin. Try login as admin.",
      });
    }
  };
}

export default new AuthMiddleware();
