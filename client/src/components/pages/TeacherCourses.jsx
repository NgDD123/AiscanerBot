// ===============================
// src/pages/teacher/TeacherCourses.jsx
// ===============================
import { useEffect, useState } from "react";
import { fetchMyCourses } from "../../servece/courseService";
import CreateCourseForm from "../../components/courses/CreateCourseForm";
import { motion } from "framer-motion";
import { FaChalkboardTeacher, FaCog } from "react-icons/fa";

const TeacherCourses = () => {
  const [courses, setCourses] = useState([]);

  const loadCourses = async () => {
    const data = await fetchMyCourses();
    setCourses(data);
  };

  useEffect(() => {
    loadCourses();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white px-6 py-10">
      <h1 className="text-4xl font-extrabold text-purple-400 flex items-center gap-3 mb-10">
        <FaChalkboardTeacher /> Teacher Courses
      </h1>

      <CreateCourseForm onCreated={loadCourses} />

      <h2 className="text-2xl font-bold text-purple-300 mt-12 mb-6">
        My Published Courses
      </h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.length === 0 && (
          <p className="text-gray-400">
            You haven’t created any courses yet.
          </p>
        )}

        {courses.map((course, index) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg"
          >
            <h3 className="text-2xl font-bold text-purple-400 mb-3">
              {course.title}
            </h3>

            <button className="w-full bg-purple-600 hover:bg-purple-700 transition p-3 rounded-xl flex items-center justify-center gap-2">
              <FaCog />
              Manage Course
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TeacherCourses;
