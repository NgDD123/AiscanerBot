// ===============================
// src/pages/courses/LessonPlayer.jsx
// ===============================
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaCheckCircle } from "react-icons/fa";
import useCourseProgress from "../../hooks/useCourseProgress";

const LessonPlayer = ({ lesson, course }) => {
  const { progress, markCompleted } = useCourseProgress(course.id);

  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setCompleted(progress.completedLessons.includes(lesson.id));
  }, [lesson.id, progress.completedLessons]);

  const handleComplete = () => {
    markCompleted(lesson.id);
    setCompleted(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <h2 className="text-2xl font-bold text-purple-400">
        {lesson.title}
      </h2>

      <video
        controls
        className="w-full rounded-xl border border-gray-700"
        src={lesson.videoUrl}
      />

      <button
        onClick={handleComplete}
        disabled={completed}
        className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 ${
          completed
            ? "bg-green-600 cursor-default"
            : "bg-purple-600 hover:bg-purple-700"
        }`}
      >
        <FaCheckCircle />
        {completed ? "Completed" : "Mark as Completed"}
      </button>

      {/* PROGRESS BAR */}
      <div className="mt-6">
        <p className="text-gray-300 mb-2">
          Progress: {progress.percent}%
        </p>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className="bg-purple-600 h-3 rounded-full transition-all"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default LessonPlayer;
