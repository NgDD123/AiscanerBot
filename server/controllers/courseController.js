const {
  createCourse,
  getAllCourses,
  getTeacherCourses,
  getStudentCourses,
  enrollStudent,
} = require("../models/courseModel");

/**
 * CREATE COURSE (Teacher)
 */
const createCourseController = async (req, res) => {
  console.log("➡️ createCourseController HIT");

  try {
    console.log("📦 Request body:", req.body);
    console.log("👤 Auth user:", req.user);

    const { title, lessons } = req.body;
    const teacherId = req.user?.uid;

    console.log("📝 Title:", title);
    console.log("📚 Lessons:", lessons);
    console.log("🧑‍🏫 Teacher ID:", teacherId);

    if (!teacherId) {
      console.log("❌ Teacher ID missing");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const courseId = await createCourse({ title, lessons, teacherId });

    console.log("✅ Course created with ID:", courseId);

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
  console.log("➡️ getAllCoursesController HIT");

  try {
    console.log("📡 Fetching all courses...");

    const courses = await getAllCourses();

    console.log("✅ Courses fetched:", courses.length);

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
  console.log("➡️ getMyCoursesController HIT");

  try {
    console.log("👤 Auth user:", req.user);

    const userId = req.user?.uid;
    const role = req.user?.role;

    console.log("🆔 User ID:", userId);
    console.log("🎭 Role:", role);

    if (!userId || !role) {
      console.log("❌ Missing userId or role");
      return res.status(401).json({ error: "Unauthorized" });
    }

    let courses;

    if (role === "teacher") {
      console.log("🧑‍🏫 Fetching teacher courses...");
      courses = await getTeacherCourses(userId);
    } else {
      console.log("🎓 Fetching student courses...");
      courses = await getStudentCourses(userId);
    }

    console.log("✅ My courses fetched:", courses.length);

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
  console.log("➡️ enrollCourseController HIT");

  try {
    console.log("👤 Auth user:", req.user);
    console.log("📦 Request body:", req.body);

    const userId = req.user?.uid;
    const { courseId } = req.body;

    console.log("🆔 User ID:", userId);
    console.log("📘 Course ID:", courseId);

    if (!userId || !courseId) {
      console.log("❌ Missing userId or courseId");
      return res.status(400).json({ error: "Missing data" });
    }

    await enrollStudent(courseId, userId);

    console.log("✅ Student enrolled successfully");

    res.json({ success: true });
  } catch (err) {
    console.error("🔥 ERROR in enrollCourseController:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createCourseController,
  getAllCoursesController,
  getMyCoursesController,
  enrollCourseController,
};
