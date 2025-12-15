const {
  db,
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
} = require("../firebase");

/**
 * CREATE COURSE (Teacher)
 */
const createCourse = async ({ title, lessons, teacherId }) => {
  console.log("📘 MODEL → createCourse");

  try {
    const ref = await addDoc(collection(db, "courses"), {
      title,
      lessons,
      teacherId,
      students: [],
      createdAt: Date.now(),
    });

    console.log("✅ Course saved with ID:", ref.id);
    return ref.id;
  } catch (error) {
    console.error("🔥 MODEL ERROR createCourse:", error);
    throw error;
  }
};

/**
 * GET ALL COURSES
 */
const getAllCourses = async () => {
  console.log("📘 MODEL → getAllCourses");

  try {
    const snapshot = await getDocs(collection(db, "courses"));

    const courses = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
    }));

    console.log("✅ Total courses:", courses.length);
    return courses;
  } catch (error) {
    console.error("🔥 MODEL ERROR getAllCourses:", error);
    throw error;
  }
};

/**
 * GET TEACHER COURSES
 */
const getTeacherCourses = async (teacherId) => {
  console.log("📘 MODEL → getTeacherCourses:", teacherId);

  try {
    const snapshot = await getDocs(collection(db, "courses"));

    const courses = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(course => course.teacherId === teacherId);

    console.log("✅ Teacher courses:", courses.length);
    return courses;
  } catch (error) {
    console.error("🔥 MODEL ERROR getTeacherCourses:", error);
    throw error;
  }
};

/**
 * GET STUDENT COURSES
 */
const getStudentCourses = async (studentId) => {
  console.log("📘 MODEL → getStudentCourses:", studentId);

  try {
    const snapshot = await getDocs(collection(db, "courses"));

    const courses = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(course => course.students?.includes(studentId));

    console.log("✅ Student courses:", courses.length);
    return courses;
  } catch (error) {
    console.error("🔥 MODEL ERROR getStudentCourses:", error);
    throw error;
  }
};

/**
 * ENROLL STUDENT (SAFE VERSION)
 */
const enrollStudent = async (courseId, studentId) => {
  console.log("📘 MODEL → enrollStudent");
  console.log("📘 Course ID:", courseId);
  console.log("📘 Student ID:", studentId);

  try {
    const snapshot = await getDocs(collection(db, "courses"));

    const courseDoc = snapshot.docs.find(d => d.id === courseId);

    if (!courseDoc) {
      console.log("❌ Course not found");
      throw new Error("Course not found");
    }

    const courseData = courseDoc.data();
    const currentStudents = courseData.students || [];

    if (currentStudents.includes(studentId)) {
      console.log("⚠️ Student already enrolled");
      return;
    }

    const updatedStudents = [...currentStudents, studentId];

    const courseRef = doc(db, "courses", courseId);

    await updateDoc(courseRef, {
      students: updatedStudents,
    });

    console.log("✅ Student enrolled successfully");
  } catch (error) {
    console.error("🔥 MODEL ERROR enrollStudent:", error);
    throw error;
  }
};

module.exports = {
  createCourse,
  getAllCourses,
  getTeacherCourses,
  getStudentCourses,
  enrollStudent,
};
