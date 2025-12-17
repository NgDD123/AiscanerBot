// ===============================
// src/pages/CoursesDashboard.jsx
// ===============================
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaPlayCircle,
  FaPlusCircle,
  FaBookOpen,
  FaChalkboardTeacher,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  fetchAllCourses,
  createCourse,
  enrollCourse,
} from "../../servece/courseService";

const CoursesDashboard = ({ role }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", lessons: "" });
  const navigate = useNavigate();

  // ✅ LOAD COURSES CORRECTLY
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const data = await fetchAllCourses(); // 🔥 FIX
        setCourses(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load courses", err);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-purple-400 text-xl">
        Loading courses...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white px-6 py-10">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-10">
        {role === "teacher" ? (
          <FaChalkboardTeacher className="text-4xl text-purple-400" />
        ) : (
          <FaBookOpen className="text-4xl text-purple-400" />
        )}
        <h1 className="text-4xl font-extrabold text-purple-400">
          {role === "teacher" ? "Teacher Dashboard" : "Available Courses"}
        </h1>
      </div>

      {/* CREATE COURSE (TEACHER ONLY) */}
      {role === "teacher" && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 p-8 rounded-2xl mb-12 border border-gray-700"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-purple-300">
            <FaPlusCircle /> Create New Course
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            <input
              placeholder="Course Title"
              className="p-4 rounded-xl bg-gray-900 border border-gray-700"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
            />

            <input
              placeholder="Initial Lessons (optional)"
              className="p-4 rounded-xl bg-gray-900 border border-gray-700"
              value={form.lessons}
              onChange={(e) =>
                setForm({ ...form, lessons: e.target.value })
              }
            />

            <button
              onClick={async () => {
                await createCourse(form);
                window.location.reload();
              }}
              className="bg-purple-600 hover:bg-purple-700 rounded-xl font-bold"
            >
              Publish Course
            </button>
          </div>
        </motion.div>
      )}

      {/* COURSES GRID */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.length === 0 && (
          <div className="text-gray-400">
            No courses available.
          </div>
        )}

        {courses.map((c, index) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-800 p-6 rounded-2xl border border-gray-700"
          >
            <h3 className="text-2xl font-bold text-purple-400 mb-2">
              {c.title}
            </h3>

            <p className="text-gray-400 mb-4">
              Lessons:{" "}
              <span className="text-white">
                {Array.isArray(c.lessons) ? c.lessons.length : 0}
              </span>
            </p>

            <button
              onClick={async () => {
                if (role === "student") {
                  await enrollCourse(c.id);
                  navigate(`/course/${c.id}`);
                } else {
                  navigate(`/teacher/course/${c.id}`);
                }
              }}
              className="w-full bg-purple-600 hover:bg-purple-700 p-3 rounded-xl flex items-center justify-center gap-2 font-semibold"
            >
              <FaPlayCircle />
              {role === "student"
                ? "Enroll & Start"
                : "Manage Course"}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CoursesDashboard;
