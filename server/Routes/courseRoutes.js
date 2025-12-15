const express = require("express");
const {
  createCourseController,
  getAllCoursesController,
  getMyCoursesController,
  enrollCourseController,
} = require("../controllers/courseController");
const { verifyToken } = require("../config/middlewares");

const router = express.Router();

router.get("/", getAllCoursesController);
router.get("/my", verifyToken, getMyCoursesController);
router.post("/create", verifyToken, createCourseController);
router.post("/enroll", verifyToken, enrollCourseController);

module.exports = router;
