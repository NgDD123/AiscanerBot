// ===============================
// src/pages/courses/LessonPlayer.jsx
// ===============================
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaCheckCircle, FaFilePdf, FaFileImage, FaFilePowerpoint, FaFileAlt } from "react-icons/fa";
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

  // 🔹 Render lesson content blocks
  const renderContent = (content) => {
    switch (content.type) {
      case "text":
        return (
          <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
            <p className="text-gray-200 whitespace-pre-line">
              {content.value}
            </p>
          </div>
        );

      case "image":
        return (
          <img
            src={content.url}
            alt={content.name}
            className="rounded-xl border border-gray-700 max-h-[500px]"
          />
        );

      case "pdf":
        return (
          <div className="space-y-2">
            <iframe
              src={content.url}
              className="w-full h-[500px] rounded-xl border border-gray-700"
              title={content.name}
            />
            <a
              href={content.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-purple-400 underline"
            >
              <FaFilePdf /> Download PDF
            </a>
          </div>
        );

      case "ppt":
      case "doc":
      default:
        return (
          <a
            href={content.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-gray-800 p-3 rounded-xl border border-gray-700 hover:bg-gray-700"
          >
            {content.type === "ppt" ? <FaFilePowerpoint /> : <FaFileAlt />}
            <span className="text-gray-200">{content.name}</span>
          </a>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* TITLE */}
      <h2 className="text-2xl font-bold text-purple-400">
        {lesson.title}
      </h2>

      {/* 🎥 VIDEO */}
      {lesson.videoUrl && (
        lesson.videoType === "youtube" ? (
          <iframe
            className="w-full h-[400px] rounded-xl border border-gray-700"
            src={lesson.videoUrl.replace("watch?v=", "embed/")}
            allowFullScreen
            title="Lesson video"
          />
        ) : (
          <video
            controls
            className="w-full rounded-xl border border-gray-700"
            src={lesson.videoUrl}
          />
        )
      )}

      {/* 📘 ADDITIONAL CONTENT */}
      {lesson.contents?.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-200">
            Lesson Materials
          </h3>

          {lesson.contents.map((content) => (
            <div key={content.id}>
              {renderContent(content)}
            </div>
          ))}
        </div>
      )}

      {/* ✅ COMPLETE BUTTON */}
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

      {/* 📊 PROGRESS BAR */}
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
