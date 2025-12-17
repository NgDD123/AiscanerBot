// ===============================
// src/pages/teacher/TeacherLessonManager.jsx
// ===============================
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchCourseById, addLesson } from "../../servece/courseService";
import { FaPlusCircle, FaBook } from "react-icons/fa";

const TeacherLessonManager = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoType, setVideoType] = useState("youtube");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCourse = async () => {
      if (!id) {
        setError("Invalid course ID");
        setLoading(false);
        return;
      }

      try {
        const data = await fetchCourseById(id);
        setCourse(data);
      } catch (err) {
        setError("Failed to load course");
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [id]);

  const handleAddLesson = async () => {
    if (!title.trim() || !videoUrl.trim()) {
      setError("Title and video URL are required");
      return;
    }

    try {
      await addLesson(id, {
        title,
        videoUrl,
        videoType,
      });

      const updated = await fetchCourseById(id);
      setCourse(updated);

      setTitle("");
      setVideoUrl("");
      setVideoType("youtube");
      setError("");
    } catch (err) {
      console.error(err);
      setError("Add lesson failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-purple-400">
        Loading course...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-red-400">
        {error}
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-gray-400">
        Course not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-purple-400 mb-6 flex items-center gap-2">
        <FaBook /> Manage Lessons – {course.title}
      </h1>

      {/* ADD LESSON */}
      <div className="bg-gray-800 p-6 rounded-2xl mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FaPlusCircle /> Add New Lesson
        </h2>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Lesson title"
          className="w-full p-3 mb-3 rounded-xl bg-gray-900 border border-gray-700"
        />

        <select
          value={videoType}
          onChange={(e) => setVideoType(e.target.value)}
          className="w-full p-3 mb-3 rounded-xl bg-gray-900 border border-gray-700"
        >
          <option value="youtube">YouTube</option>
          <option value="mp4">MP4</option>
        </select>

        <input
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="Video URL"
          className="w-full p-3 mb-4 rounded-xl bg-gray-900 border border-gray-700"
        />

        <button
          onClick={handleAddLesson}
          className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-bold"
        >
          Add Lesson
        </button>
      </div>

      {/* LESSON LIST */}
      <div className="bg-gray-800 p-6 rounded-2xl">
        <h2 className="text-xl font-semibold mb-4">Lessons</h2>

        {course.lessons?.length === 0 && (
          <div className="text-gray-400">No lessons yet.</div>
        )}

        {course.lessons?.map((lesson, i) => (
          <div
            key={lesson.id || i}
            className="p-3 rounded-xl bg-gray-900 mb-2"
          >
            {lesson.title}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeacherLessonManager;
