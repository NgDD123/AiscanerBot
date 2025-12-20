import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaCheckCircle, FaFilePdf, FaImage, FaFilePowerpoint, FaFont } from "react-icons/fa";
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

      {/* 📚 LESSON CONTENTS */}
      {lesson.contents?.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-purple-300">
            Lesson Materials
          </h3>

          {lesson.contents.map((c, index) => (
            <div
              key={index}
              className="bg-gray-800 border border-gray-700 rounded-xl p-4"
            >
              {/* TEXT */}
              {c.type === "text" && (
                <div className="flex gap-3">
                  <FaFont className="text-purple-400 mt-1" />
                  <p className="text-gray-200 whitespace-pre-line">
                    {c.value}
                  </p>
                </div>
              )}

              {/* IMAGE */}
              {c.type === "image" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-purple-300">
                    <FaImage /> Image
                  </div>
                  <img
                    src={c.url || c.value}
                    alt="Lesson content"
                    className="rounded-xl max-h-[400px]"
                  />
                </div>
              )}

              {/* PDF */}
              {c.type === "pdf" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-purple-300">
                    <FaFilePdf /> PDF Document
                  </div>
                  <a
                    href={c.url || c.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 underline"
                  >
                    Open PDF
                  </a>
                </div>
              )}

              {/* PPT / DOC */}
              {(c.type === "ppt" || c.type === "doc") && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-purple-300">
                    <FaFilePowerpoint /> Presentation / Document
                  </div>
                  <a
                    href={c.url || c.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 underline"
                  >
                    Download File
                  </a>
                </div>
              )}
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

      {/* 📊 PROGRESS */}
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
