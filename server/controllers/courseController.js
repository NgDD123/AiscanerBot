const {
  createCourse,
  getAllCourses,
  getTeacherCourses,
  getStudentCourses,
  enrollStudent,
  getCourseById, // ✅ ADD THIS MODEL METHOD
  addLesson,
  updateLesson,
  deleteLesson,
} = require("../models/courseModel");

/**
 * CREATE COURSE (Teacher)
 */
const createCourseController = async (req, res) => {
  console.log("➡️ createCourseController HIT");

  try {
    const { title, lessons } = req.body;
    const teacherId = req.user?.uid;

    if (!teacherId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const courseId = await createCourse({ title, lessons, teacherId });
    res.status(201).json({ success: true, courseId });
  } catch (err) {
    console.error("🔥 ERROR in createCourseController:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET ALL COURSES (Public)
 */
const getAllCoursesController = async (req, res) => {
  try {
    const courses = await getAllCourses();
    res.json(courses);
  } catch (err) {
    console.error("🔥 ERROR in getAllCoursesController:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET MY COURSES (Student / Teacher)
 */
const getMyCoursesController = async (req, res) => {
  try {
    const userId = req.user?.uid;
    const role = req.user?.role;

    if (!userId || !role) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const courses =
      role === "teacher"
        ? await getTeacherCourses(userId)
        : await getStudentCourses(userId);

    res.json(courses);
  } catch (err) {
    console.error("🔥 ERROR in getMyCoursesController:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * ENROLL STUDENT
 */
const enrollCourseController = async (req, res) => {
  try {
    const userId = req.user?.uid;
    const { courseId } = req.body;

    if (!userId || !courseId) {
      return res.status(400).json({ error: "Missing data" });
    }

    await enrollStudent(courseId, userId);
    res.json({ success: true });
  } catch (err) {
    console.error("🔥 ERROR in enrollCourseController:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET SINGLE COURSE BY ID (FIXES 404)
 */
const getCourseByIdController = async (req, res) => {
  console.log("➡️ getCourseByIdController HIT");

  try {
    const courseId = req.params.id;

    const course = await getCourseById(courseId);

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json(course);
  } catch (err) {
    console.error("🔥 ERROR in getCourseByIdController:", err);
    res.status(500).json({ error: err.message });
  }
};
const addLessonController = async (req, res) => {
  console.log("➡️ addLessonController HIT");
  console.log("📥 BODY:", req.body);

  try {
    const courseId = req.params.id;
    const { title, videoUrl, videoType } = req.body;

    // ✅ strict validation
    if (!title || !videoUrl) {
      return res.status(400).json({
        message: "Lesson title and video URL are required",
      });
    }

    await addLesson(courseId, {
      title,
      videoUrl,
      videoType: videoType || "youtube",
      createdAt: Date.now(),
    });

    res.status(201).json({ message: "Lesson added successfully" });
  } catch (error) {
    console.error("🔥 addLessonController ERROR:", error);
    res.status(500).json({ message: "Failed to add lesson" });
  }
};


/**
 * UPDATE LESSON
 */
const updateLessonController = async (req, res) => {
  try {
    const { id, lessonId } = req.params;
    const updates = req.body;

    await updateLesson(id, lessonId, updates);

    res.json({ message: "Lesson updated" });
  } catch (err) {
    console.error("Update lesson failed:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * DELETE LESSON
 */
const deleteLessonController = async (req, res) => {
  try {
    const { id, lessonId } = req.params;

    await deleteLesson(id, lessonId);

    res.json({ message: "Lesson deleted" });
  } catch (err) {
    console.error("Delete lesson failed:", err);
    res.status(500).json({ error: err.message });
  }
};


module.exports = {
  createCourseController,
  getAllCoursesController,
  getMyCoursesController,
  enrollCourseController,
  getCourseByIdController, // ✅ NOW VALID
  addLessonController,
  updateLessonController,
  deleteLessonController, // ✅ EXPORT
};
