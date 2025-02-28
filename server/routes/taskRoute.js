import express from "express";
import TaskController from "../controllers/taskController.js";
import AuthMiddleware from "../middleware/authMiddleware.js";

class TaskRoutes {
  constructor() {
    this.router = express.Router(); // Create a new router instance
    this.taskController = new TaskController(); // Instantiate TaskController
    this.initializeRoutes(); // Initialize all routes
  }

  // Initialize all task-related routes
  initializeRoutes() {
    this.router.post(
      "/create",
      AuthMiddleware.protectRoute,
      AuthMiddleware.isAdminRoute,
      this.taskController.createTask
    );
    this.router.post(
      "/duplicate/:id",
      AuthMiddleware.protectRoute,
      AuthMiddleware.isAdminRoute,
      this.taskController.duplicateTask
    );
    this.router.post(
      "/activity/:id",
      AuthMiddleware.protectRoute,
      this.taskController.postTaskActivity
    );

    this.router.get(
      "/dashboard",
      AuthMiddleware.protectRoute,
      this.taskController.dashboardStatistics
    );
    this.router.get("/", AuthMiddleware.protectRoute, this.taskController.getTasks);
    this.router.get("/:id", AuthMiddleware.protectRoute, this.taskController.getTask);

    this.router.put(
      "/create-subtask/:id",
      AuthMiddleware.protectRoute,
      AuthMiddleware.isAdminRoute,
      this.taskController.createSubTask
    );
    this.router.put(
      "/update/:id",
      AuthMiddleware.protectRoute,
      AuthMiddleware.isAdminRoute,
      this.taskController.updateTask
    );
    this.router.put(
      "/change-stage/:id",
      AuthMiddleware.protectRoute,
      this.taskController.updateTaskStage
    );
    this.router.put(
      "/change-status/:taskId/:subTaskId",
      AuthMiddleware.protectRoute,
      this.taskController.updateSubTaskStage
    );
    this.router.put(
      "/:id",
      AuthMiddleware.protectRoute,
      AuthMiddleware.isAdminRoute,
      this.taskController.trashTask
    );

    this.router.delete(
      "/delete-restore/:id?",
      AuthMiddleware.protectRoute,
      AuthMiddleware.isAdminRoute,
      this.taskController.deleteRestoreTask
    );
  }

  // Method to return the router instance
  getRouter() {
    return this.router;
  }
}

// Export an instance of TaskRoutes
export default new TaskRoutes().getRouter();
