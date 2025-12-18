// ===============================
// src/components/courses/LessonForm.jsx
// ===============================
import { useState } from "react";
import { motion } from "framer-motion";
import { addLesson } from "../../services/courseService";
import axios from "axios";
import { getAuth } from "firebase/auth";
import { uploadFile } from "../../services/uploadService";

const API_BASE = "http://localhost:8001/api/courses";

const LessonForm = ({ courseId, lesson, onClose, onSaved }) => {
  const [title, setTitle] = useState(lesson?.title || "");
  const [videoUrl, setVideoUrl] = useState(lesson?.videoUrl || "");
  const [videoType, setVideoType] = useState(lesson?.videoType || "youtube");

  const [contents, setContents] = useState(lesson?.contents || []);
  const [textContent, setTextContent] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getToken = async () => {
    const user = getAuth().currentUser;
    if (!user) throw new Error("Not authenticated");
    return await user.getIdToken();
  };

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

  const handleFileUpload = async (file) => {
    if (!file) return;

    try {
      const url = await uploadFile(file);

      let type = "doc";
      if (file.type.includes("pdf")) type = "pdf";
      else if (file.type.includes("image")) type = "image";
      else if (file.name.match(/\.pptx?$/)) type = "ppt";

      setContents((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type,
          url,
          name: file.name,
        },
      ]);
    } catch {
      setError("File upload failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!title.trim()) throw new Error("Lesson title is required");

      const payload = { title, videoUrl, videoType, contents };

      if (lesson) {
        const token = await getToken();
        await axios.put(
          `${API_BASE}/${courseId}/lessons/${lesson.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await addLesson(courseId, payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save lesson");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
      <h2 className="text-2xl font-bold text-purple-400 mb-4">
        {lesson ? "Edit Lesson" : "Add Lesson"}
      </h2>

      {error && <p className="text-red-400">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full p-3 rounded bg-gray-900 text-white"
          placeholder="Lesson title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <select
          className="w-full p-3 rounded bg-gray-900 text-white"
          value={videoType}
          onChange={(e) => setVideoType(e.target.value)}
        >
          <option value="youtube">YouTube</option>
          <option value="mp4">MP4</option>
        </select>

        <input
          className="w-full p-3 rounded bg-gray-900 text-white"
          placeholder="Video URL (optional)"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
        />

        {/* TEXT CONTENT */}
        <textarea
          className="w-full p-3 rounded bg-gray-900 text-white"
          placeholder="Lesson notes / explanation"
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
        />
        <button
          type="button"
          onClick={addTextContent}
          className="bg-gray-700 px-4 py-2 rounded"
        >
          Add Text
        </button>

        {/* FILE UPLOAD */}
        <input
          type="file"
          accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg,.txt"
          onChange={(e) => handleFileUpload(e.target.files[0])}
        />

        {/* CONTENT LIST */}
        {contents.length > 0 && (
          <div className="bg-gray-900 p-3 rounded">
            {contents.map((c) => (
              <div key={c.id} className="text-sm text-gray-300">
                • {c.type.toUpperCase()} — {c.name || "Text"}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-purple-600 p-3 rounded font-bold"
          >
            {loading ? "Saving..." : "Save Lesson"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-700 p-3 rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default LessonForm;
