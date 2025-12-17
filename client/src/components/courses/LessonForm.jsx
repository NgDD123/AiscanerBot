// ===============================
// src/components/courses/LessonForm.jsx
// ===============================
import { useState } from "react";
import { motion } from "framer-motion";
import { addLesson } from "../../servece/courseService";
import axios from "axios";
import { getAuth } from "firebase/auth";

const API_BASE = "http://localhost:8001/api/courses";

const LessonForm = ({ courseId, lesson, onClose, onSaved }) => {
  const [title, setTitle] = useState(lesson?.title || "");
  const [videoUrl, setVideoUrl] = useState(lesson?.videoUrl || "");
  const [videoType, setVideoType] = useState(
    lesson?.videoType || "youtube"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔐 get token manually for edit (PUT)
  const getToken = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");
    return await user.getIdToken();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 🔎 Basic validation
      if (!title.trim()) {
        throw new Error("Lesson title is required");
      }

      if (videoType === "youtube" && !videoUrl.includes("youtube")) {
        throw new Error("Please provide a valid YouTube URL");
      }

      if (videoType === "mp4" && !videoUrl.endsWith(".mp4")) {
        throw new Error("MP4 video must end with .mp4");
      }

      if (lesson) {
        // ✏️ EDIT LESSON
        const token = await getToken();

        await axios.put(
          `${API_BASE}/${courseId}/lessons/${lesson.id}`,
          { title, videoUrl, videoType },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        // ➕ ADD LESSON
        await addLesson(courseId, {
          title,
          videoUrl,
          videoType,
        });
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error("Lesson save failed", err);
      setError(err.message || "Failed to save lesson");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-8"
    >
      <h2 className="text-2xl font-bold text-purple-400 mb-4">
        {lesson ? "Edit Lesson" : "Add New Lesson"}
      </h2>

      {error && (
        <div className="bg-red-900/40 border border-red-600 text-red-300 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <input
          className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-white"
          placeholder="Lesson title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* Video Type */}
        <select
          className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-white"
          value={videoType}
          onChange={(e) => setVideoType(e.target.value)}
        >
          <option value="youtube">YouTube</option>
          <option value="mp4">MP4</option>
        </select>

        {/* Video URL */}
        <input
          className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-white"
          placeholder={
            videoType === "youtube"
              ? "https://www.youtube.com/watch?v=xxxx"
              : "https://example.com/video.mp4"
          }
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          required
        />

        {/* 🎥 VIDEO PREVIEW */}
        {videoUrl && (
          <div className="mt-4">
            {videoType === "youtube" ? (
              <iframe
                className="w-full h-[300px] rounded-xl border border-gray-700"
                src={videoUrl.replace("watch?v=", "embed/")}
                allowFullScreen
                title="Lesson preview"
              />
            ) : (
              <video
                controls
                className="w-full rounded-xl border border-gray-700"
                src={videoUrl}
              />
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-purple-600 hover:bg-purple-700 p-3 rounded-xl font-bold"
          >
            {loading ? "Saving..." : "Save Lesson"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 p-3 rounded-xl"
          >
            Cancel
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default LessonForm;
