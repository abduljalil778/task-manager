import asyncHandler from "express-async-handler";
import Notice from "../models/notis.js";
import Task from "../models/taskModel.js";
import User from "../models/userModel.js";

class TaskController {
  // Create a new task
  createTask = asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const { title, team, stage, date, priority, assets, links, description } = req.body;

    try {
      // Prepare the activity message
      let text = "New task has been assigned to you";
      if (team?.length > 1) {
        text += ` and ${team.length - 1} others.`;
      }
      text += ` The task priority is set at ${priority} priority, so check and act accordingly. The task date is ${new Date(
        date
      ).toDateString()}. Thank you!`;

      const activity = {
        type: "started",
        activity: text,
        by: userId,
      };

      const newLinks = links ? links.split(",") : [];

      // Create a new task
      const task = await Task.create({
        title,
        team,
        stage: stage.toLowerCase(),
        date,
        priority: priority.toLowerCase(),
        assets,
        activities: [activity],
        links: newLinks,
        description,
      });

      // Create a notice for the task
      await Notice.create({ team, text, task: task._id });

      // Add the task to each user's task list
      await User.updateMany(
        { _id: { $in: team } },
        { $push: { tasks: task._id } }
      );

      res.status(201).json({ status: true, task, message: "Task created successfully." });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: false, message: error.message });
    }
  });

  // Duplicate an existing task
  duplicateTask = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { userId } = req.user;

    try {
      const task = await Task.findById(id);
      if (!task) throw new Error("Task not found");

      const text = `New task has been duplicated with priority ${task.priority}. Please check and act accordingly.`;

      const activity = {
        type: "assigned",
        activity: text,
        by: userId,
      };

      const newTask = await Task.create({
        ...task._doc,
        title: "Duplicate - " + task.title,
        activities: [activity],
      });

      await Notice.create({ team: newTask.team, text, task: newTask._id });

      res.status(201).json({ status: true, task: newTask, message: "Task duplicated successfully." });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: false, message: error.message });
    }
  });

  // Get all tasks
  getTasks = asyncHandler(async (req, res) => {
    const { userId, isAdmin } = req.user;
    const { stage, isTrashed, search } = req.query;

    try {
      let query = { isTrashed: isTrashed === "true" };

      if (!isAdmin) query.team = { $all: [userId] };
      if (stage) query.stage = stage;

      if (search) {
        query = {
          ...query,
          $or: [
            { title: { $regex: search, $options: "i" } },
            { stage: { $regex: search, $options: "i" } },
            { priority: { $regex: search, $options: "i" } },
          ],
        };
      }

      const tasks = await Task.find(query)
        .populate({ path: "team", select: "name title email" })
        .sort({ _id: -1 });

      res.status(200).json({ status: true, tasks });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: false, message: error.message });
    }
  });

  // Get a specific task by ID
  getTask = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      const task = await Task.findById(id)
        .populate({ path: "team", select: "name title role email" })
        .populate({ path: "activities.by", select: "name" });

      if (!task) throw new Error("Task not found");

      res.status(200).json({ status: true, task });
    } catch (error) {
      console.error(error);
      res.status(404).json({ status: false, message: error.message });
    }
  });

  // Update a task
  updateTask = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, date, team, stage, priority, assets, links, description } = req.body;

    try {
      const task = await Task.findById(id);
      if (!task) throw new Error("Task not found");

      const newLinks = links ? links.split(",") : [];

      task.title = title;
      task.date = date;
      task.priority = priority.toLowerCase();
      task.assets = assets;
      task.stage = stage.toLowerCase();
      task.team = team;
      task.links = newLinks;
      task.description = description;

      await task.save();

      res.status(200).json({ status: true, message: "Task updated successfully." });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: false, message: error.message });
    }
  });

  updateTaskStage = asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const { stage } = req.body;
  
      const task = await Task.findById(id);
  
      task.stage = stage.toLowerCase();
  
      await task.save();
  
      res
        .status(200)
        .json({ status: true, message: "Task stage changed successfully." });
    } catch (error) {
      return res.status(400).json({ status: false, message: error.message });
    }
  });

  updateSubTaskStage = asyncHandler(async (req, res) => {
    try {
      const { taskId, subTaskId } = req.params;
      const { status } = req.body;
  
      await Task.findOneAndUpdate(
        {
          _id: taskId,
          "subTasks._id": subTaskId,
        },
        {
          $set: {
            "subTasks.$.isCompleted": status,
          },
        }
      );
  
      res.status(200).json({
        status: true,
        message: status
          ? "Task has been marked completed"
          : "Task has been marked uncompleted",
      });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ status: false, message: error.message });
    }
  });

  createSubTask = asyncHandler(async (req, res) => {
    const { title, tag, date } = req.body;
    const { id } = req.params;
  
    try {
      const newSubTask = {
        title,
        date,
        tag,
        isCompleted: false,
      };
  
      const task = await Task.findById(id);
  
      task.subTasks.push(newSubTask);
  
      await task.save();
  
      res
        .status(200)
        .json({ status: true, message: "SubTask added successfully." });
    } catch (error) {
      return res.status(400).json({ status: false, message: error.message });
    }
  });

  getTasks = asyncHandler(async (req, res) => {
    const { userId, isAdmin } = req.user;
    const { stage, isTrashed, search } = req.query;
  
    let query = { isTrashed: isTrashed ? true : false };
  
    if (!isAdmin) {
      query.team = { $all: [userId] };
    }
    if (stage) {
      query.stage = stage;
    }
  
    if (search) {
      const searchQuery = {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { stage: { $regex: search, $options: "i" } },
          { priority: { $regex: search, $options: "i" } },
        ],
      };
      query = { ...query, ...searchQuery };
    }
  
    let queryResult = Task.find(query)
      .populate({
        path: "team",
        select: "name title email",
      })
      .sort({ _id: -1 });
  
    const tasks = await queryResult;
  
    res.status(200).json({
      status: true,
      tasks,
    });
  });

  getTask = asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
  
      const task = await Task.findById(id)
        .populate({
          path: "team",
          select: "name title role email",
        })
        .populate({
          path: "activities.by",
          select: "name",
        })
        .sort({ _id: -1 });
  
      res.status(200).json({
        status: true,
        task,
      });
    } catch (error) {
      console.log(error);
      throw new Error("Failed to fetch task", error);
    }
  });

  postTaskActivity = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { userId } = req.user;
    const { type, activity } = req.body;
  
    try {
      const task = await Task.findById(id);
  
      const data = {
        type,
        activity,
        by: userId,
      };
      task.activities.push(data);
  
      await task.save();
  
      res
        .status(200)
        .json({ status: true, message: "Activity posted successfully." });
    } catch (error) {
      return res.status(400).json({ status: false, message: error.message });
    }
  });

  trashTask = asyncHandler(async (req, res) => {
    const { id } = req.params;
  
    try {
      const task = await Task.findById(id);
  
      task.isTrashed = true;
  
      await task.save();
  
      res.status(200).json({
        status: true,
        message: `Task trashed successfully.`,
      });
    } catch (error) {
      return res.status(400).json({ status: false, message: error.message });
    }
  });

  deleteRestoreTask = asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const { actionType } = req.query;
  
      if (actionType === "delete") {
        await Task.findByIdAndDelete(id);
      } else if (actionType === "deleteAll") {
        await Task.deleteMany({ isTrashed: true });
      } else if (actionType === "restore") {
        const resp = await Task.findById(id);
  
        resp.isTrashed = false;
  
        resp.save();
      } else if (actionType === "restoreAll") {
        await Task.updateMany(
          { isTrashed: true },
          { $set: { isTrashed: false } }
        );
      }
  
      res.status(200).json({
        status: true,
        message: `Operation performed successfully.`,
      });
    } catch (error) {
      return res.status(400).json({ status: false, message: error.message });
    }
  });

  dashboardStatistics = asyncHandler(async (req, res) => {
    try {
      const { userId, isAdmin } = req.user;
  
      // Fetch all tasks from the database
      const allTasks = isAdmin
        ? await Task.find({
            isTrashed: false,
          })
            .populate({
              path: "team",
              select: "name role title email",
            })
            .sort({ _id: -1 })
        : await Task.find({
            isTrashed: false,
            team: { $all: [userId] },
          })
            .populate({
              path: "team",
              select: "name role title email",
            })
            .sort({ _id: -1 });
  
      const users = await User.find({ isActive: true })
        .select("name title role isActive createdAt")
        .limit(10)
        .sort({ _id: -1 });
  
      // Group tasks by stage and calculate counts
      const groupedTasks = allTasks?.reduce((result, task) => {
        const stage = task.stage;
  
        if (!result[stage]) {
          result[stage] = 1;
        } else {
          result[stage] += 1;
        }
  
        return result;
      }, {});
  
      const graphData = Object.entries(
        allTasks?.reduce((result, task) => {
          const { priority } = task;
          result[priority] = (result[priority] || 0) + 1;
          return result;
        }, {})
      ).map(([name, total]) => ({ name, total }));
  
      // Calculate total tasks
      const totalTasks = allTasks.length;
      const last10Task = allTasks?.slice(0, 10);
  
      // Combine results into a summary object
      const summary = {
        totalTasks,
        last10Task,
        users: isAdmin ? users : [],
        tasks: groupedTasks,
        graphData,
      };
  
      res
        .status(200)
        .json({ status: true, ...summary, message: "Successfully." });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ status: false, message: error.message });
    }
  });
}

export default TaskController;
