// ===============================
// src/pages/student/StudentCourses.jsx (PROFESSIONAL)
// ===============================
import { useEffect, useState } from "react";
import { fetchMyCourses } from "../../servece/courseService";
import { motion } from "framer-motion";
import { FaBookOpen, FaPlay, FaChartLine } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const StudentCourses = () => {
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyCourses().then(setCourses);
  }, []);

  const getProgress = (courseId) => {
    const saved = localStorage.getItem(`progress-${courseId}`);
    if (!saved) return 0;
    return JSON.parse(saved).percent || 0;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white px-6 py-10">
      {/* HEADER */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-extrabold text-purple-400 flex items-center gap-3 mb-10"
      >
        <FaBookOpen /> My Enrolled Courses
      </motion.h1>

      {/* EMPTY STATE */}
      {courses.length === 0 && (
        <div className="text-gray-400 text-lg">
          You have not enrolled in any courses yet.
        </div>
      )}

      {/* COURSE GRID */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.map((course, index) => {
          const progress = getProgress(course.id);

          return (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.03 }}
              className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg flex flex-col justify-between"
            >
              {/* COURSE INFO */}
              <div>
                <h2 className="text-2xl font-bold text-purple-300 mb-2">
                  {course.title}
                </h2>

                <p className="text-gray-400 text-sm mb-4">
                  Continue where you left off and track your learning progress.
                </p>

                {/* PROGRESS */}
                <div className="mb-4">
                  <div className="flex justify-between items-center text-sm text-gray-300 mb-1">
                    <span className="flex items-center gap-1">
                      <FaChartLine /> Progress
                    </span>
                    <span>{progress}%</span>
                  </div>

                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-purple-600 h-3 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* ACTION */}
              <button
                onClick={() => navigate(`/course/${course.id}`)}
                className="mt-4 w-full bg-purple-600 hover:bg-purple-700 transition p-3 rounded-xl flex items-center justify-center gap-2 font-bold"
              >
                <FaPlay />
                {progress > 0 ? "Continue Learning" : "Start Course"}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentCourses;
