import express from "express";
import UserRoutes from "./userRoute.js";
import TaskRoutes from "./taskRoute.js";

const router = express.Router();

router.use("/user", UserRoutes);
router.use("/task", TaskRoutes);

export default router;
