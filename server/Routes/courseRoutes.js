const express = require("express");
const upload = require("../upload/upload");
const {
  createCourseController,
  getAllCoursesController,
  getMyCoursesController,
  enrollCourseController,
  getCourseByIdController,
   addLessonController, // ✅ ADD
  updateLessonController,
  deleteLessonController,
   uploadFileController, // ✅ ADD
} = require("../controllers/courseController");
const { verifyToken } = require("../config/middlewares");

const router = express.Router();

router.get("/", getAllCoursesController);
router.get("/my", verifyToken, getMyCoursesController);
router.post("/create", verifyToken, createCourseController);
router.post("/enroll", verifyToken, enrollCourseController);
router.get("/:id", verifyToken, getCourseByIdController);
router.get("/:id/lessons", verifyToken, addLessonController);
router.post("/:id/lessons", verifyToken, addLessonController);
router.put("/:id/lessons/:lessonId", verifyToken, updateLessonController);
router.delete("/:id/lessons/:lessonId", verifyToken, deleteLessonController);
 router.post("/upload", upload.single("file"), uploadFileController);


module.exports = router;
