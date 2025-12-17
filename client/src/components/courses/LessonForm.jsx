// ===============================
// src/components/courses/LessonForm.jsx
// ===============================
import { useState } from "react";
import { motion } from "framer-motion";
import { addLesson } from "../../servece/courseService";
import axios from "axios";
import { getAuth } from "firebase/auth";

// 🔹 NEW: file upload helper
import { uploadFile } from "../../services/uploadService";

const API_BASE = "http://localhost:8001/api/courses";

const LessonForm = ({ courseId, lesson, onClose, onSaved }) => {
  const [title, setTitle] = useState(lesson?.title || "");
  const [videoUrl, setVideoUrl] = useState(lesson?.videoUrl || "");
  const [videoType, setVideoType] = useState(
    lesson?.videoType || "youtube"
  );

  // 🔹 NEW CONTENT STATE
  const [contents, setContents] = useState(lesson?.contents || []);
  const [textContent, setTextContent] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔐 get token manually for edit (PUT)
  const getToken = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");
    return await user.getIdToken();
  };

  // 🔹 ADD TEXT CONTENT
  const addTextContent = () => {
    if (!textContent.trim()) return;

    setContents((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: "text",
        value: textContent,
      },
    ]);

    setTextContent("");
  };

  // 🔹 ADD FILE CONTENT
  const handleFileUpload = async (file) => {
    if (!file) return;

    const url = await uploadFile(file);

    let type = "doc";
    if (file.type.includes("pdf")) type = "pdf";
    else if (file.type.includes("image")) type = "image";
    else if (file.name.endsWith(".ppt") || file.name.endsWith(".pptx"))
      type = "ppt";

    setContents((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type,
        url,
        name: file.name,
      },
    ]);
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

      if (videoType === "youtube" && videoUrl && !videoUrl.includes("youtube")) {
        throw new Error("Please provide a valid YouTube URL");
      }

      if (videoType === "mp4" && videoUrl && !videoUrl.endsWith(".mp4")) {
        throw new Error("MP4 video must end with .mp4");
      }

      if (lesson) {
        // ✏️ EDIT LESSON
        const token = await getToken();

        await axios.put(
          `${API_BASE}/${courseId}/lessons/${lesson.id}`,
          { title, videoUrl, videoType, contents },
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
          contents, // ✅ NEW
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

        {/* 📝 TEXT CONTENT */}
        <textarea
          className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-white"
          placeholder="Add lesson text (notes, explanation, steps...)"
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
        />
        <button
          type="button"
          onClick={addTextContent}
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg"
        >
          Add Text Content
        </button>

        {/* 📎 FILE UPLOAD */}
        <input
          type="file"
          accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg,.txt"
          onChange={(e) => handleFileUpload(e.target.files[0])}
          className="w-full text-gray-300"
        />

        {/* CONTENT LIST */}
        {contents.length > 0 && (
          <div className="bg-gray-900 p-3 rounded-xl">
            {contents.map((c) => (
              <div key={c.id} className="text-sm text-gray-300 mb-1">
                • {c.type.toUpperCase()} – {c.name || "Text content"}
              </div>
            ))}
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
