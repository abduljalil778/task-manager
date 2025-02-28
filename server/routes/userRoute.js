import express from "express";
import UserController from "../controllers/userController.js";
import AuthMiddleware from "../middleware/authMiddleware.js";

class UserRoutes {
  constructor() {
    this.router = express.Router();
    this.userController = new UserController();
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.post("/register", this.userController.registerUser);
    this.router.post("/login", this.userController.loginUser);
    this.router.post("/logout", this.userController.logoutUser);

    this.router.get(
      "/get-team",
      AuthMiddleware.protectRoute,
      AuthMiddleware.isAdminRoute,
      this.userController.getTeamList
    );
    this.router.get(
      "/notifications",
      AuthMiddleware.protectRoute,
      this.userController.getNotificationsList
    );

    this.router.put(
      "/profile",
      AuthMiddleware.protectRoute,
      this.userController.updateUserProfile
    );
    this.router.put(
      "/change-password",
      AuthMiddleware.protectRoute,
      this.userController.changeUserPassword
    );

    this.router
      .route("/:id")
      .put(
        AuthMiddleware.protectRoute,
        AuthMiddleware.isAdminRoute,
        this.userController.activateUserProfile
      )
      .delete(
        AuthMiddleware.protectRoute,
        AuthMiddleware.isAdminRoute,
        this.userController.deleteUserProfile
      );
  }

  getRouter() {
    return this.router;
  }
}

export default new UserRoutes().getRouter();
