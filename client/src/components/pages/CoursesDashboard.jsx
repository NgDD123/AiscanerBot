// ===============================
// src/pages/CoursesDashboard.jsx
// ===============================
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FaPlayCircle,
  FaPlusCircle,
  FaBookOpen,
  FaChalkboardTeacher,
} from "react-icons/fa";
import { useCourses } from "../../hooks/useCourses";

const CoursesDashboard = ({ role }) => {
  const { courses, loading, createCourse, enrollCourse } = useCourses(role);
  const [form, setForm] = useState({ title: "", lessons: "" });

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
          {role === "teacher" ? "Teacher Dashboard" : "Student Dashboard"}
        </h1>
      </div>

      {/* CREATE COURSE (TEACHER ONLY) */}
      {role === "teacher" && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 p-8 rounded-2xl mb-12 border border-gray-700 shadow-lg"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-purple-300">
            <FaPlusCircle /> Create New Course
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            <input
              placeholder="Course Title"
              className="p-4 rounded-xl bg-gray-900 border border-gray-700 focus:outline-none focus:border-purple-500"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
            />

            <input
              placeholder="Number of Lessons"
              type="number"
              className="p-4 rounded-xl bg-gray-900 border border-gray-700 focus:outline-none focus:border-purple-500"
              value={form.lessons}
              onChange={(e) =>
                setForm({ ...form, lessons: e.target.value })
              }
            />

            <button
              onClick={() => createCourse(form)}
              className="bg-purple-600 hover:bg-purple-700 transition rounded-xl font-bold text-lg"
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
            No courses available yet.
          </div>
        )}

        {courses.map((c, index) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg hover:shadow-purple-700/30 transition"
          >
            <h3 className="text-2xl font-bold text-purple-400 mb-2">
              {c.title}
            </h3>

            <p className="text-gray-400 mb-4">
              Lessons: <span className="text-white">{c.lessons}</span>
            </p>

            <button
              onClick={() =>
                role === "student" ? enrollCourse(c.id) : null
              }
              className="w-full bg-purple-600 hover:bg-purple-700 transition p-3 rounded-xl flex items-center justify-center gap-2 font-semibold"
            >
              <FaPlayCircle />
              {role === "student"
                ? "Enroll / Continue"
                : "Manage Course"}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CoursesDashboard;
