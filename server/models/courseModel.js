const {
  db,
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  getDoc, // ✅ ADD
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
 * GET SINGLE COURSE BY ID ✅ (FIXES 404)
 */
const getCourseById = async (courseId) => {
  console.log("📘 MODEL → getCourseById:", courseId);

  try {
    const courseRef = doc(db, "courses", courseId);
    const courseSnap = await getDoc(courseRef);

    if (!courseSnap.exists()) {
      console.log("❌ Course not found");
      return null;
    }

    return {
      id: courseSnap.id,
      ...courseSnap.data(),
    };
  } catch (error) {
    console.error("🔥 MODEL ERROR getCourseById:", error);
    throw error;
  }
};

/**
 * ENROLL STUDENT (SAFE VERSION)
 */
const enrollStudent = async (courseId, studentId) => {
  console.log("📘 MODEL → enrollStudent");

  try {
    const courseRef = doc(db, "courses", courseId);
    const courseSnap = await getDoc(courseRef);

    if (!courseSnap.exists()) {
      throw new Error("Course not found");
    }

    const courseData = courseSnap.data();
    const students = courseData.students || [];

    if (students.includes(studentId)) return;

    await updateDoc(courseRef, {
      students: [...students, studentId],
    });

    console.log("✅ Student enrolled successfully");
  } catch (error) {
    console.error("🔥 MODEL ERROR enrollStudent:", error);
    throw error;
  }
};
const addLesson = async (courseId, lesson) => {
  const courseRef = doc(db, "courses", courseId);
  const snap = await getDoc(courseRef);

  if (!snap.exists()) {
    throw new Error("Course not found");
  }

  // ✅ SANITIZE INPUT (NO undefined allowed)
  const newLesson = {
    id: Date.now().toString(),
    title: lesson.title || "",
    videoUrl: lesson.videoUrl || "",
    videoType: lesson.videoType || "youtube",
    createdAt: Date.now(),
  };

  if (!newLesson.title || !newLesson.videoUrl) {
    throw new Error("Lesson title and video URL are required");
  }

  const courseData = snap.data();
  const lessons = Array.isArray(courseData.lessons)
    ? courseData.lessons
    : [];

  await updateDoc(courseRef, {
    lessons: [...lessons, newLesson],
  });
};


/**
 * UPDATE LESSON
 */
const updateLesson = async (courseId, lessonId, updates) => {
  const courseRef = doc(db, "courses", courseId);
  const snap = await getDoc(courseRef);

  if (!snap.exists()) throw new Error("Course not found");

  const lessons = snap.data().lessons || [];

  const updatedLessons = lessons.map(l =>
    l.id === lessonId ? { ...l, ...updates } : l
  );

  await updateDoc(courseRef, { lessons: updatedLessons });
};

/**
 * DELETE LESSON
 */
const deleteLesson = async (courseId, lessonId) => {
  const courseRef = doc(db, "courses", courseId);
  const snap = await getDoc(courseRef);

  if (!snap.exists()) throw new Error("Course not found");

  const lessons = snap.data().lessons || [];

  await updateDoc(courseRef, {
    lessons: lessons.filter(l => l.id !== lessonId),
  });
};

module.exports = {
  createCourse,
  getAllCourses,
  getTeacherCourses,
  getStudentCourses,
  enrollStudent,
  getCourseById, // ✅ EXPORT
  addLesson,
  updateLesson,
  deleteLesson,
};
