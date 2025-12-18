// ===============================
// TeacherLessonManager.jsx
// ===============================
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  fetchCourseById,
  addLesson,
  deleteLesson,
  updateLessonOrder,
} from "../../servece/courseService";

import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
  FaBook,
  FaPlusCircle,
  FaTrash,
  FaGripLines,
  FaFilePdf,
  FaImage,
  FaFilePowerpoint,
  FaFont,
} from "react-icons/fa";

// 🔹 upload helper (already used elsewhere in your app)
import { uploadFile } from "../../servece/courseService";

// -------------------------------
// Sortable Lesson Item (UNCHANGED)
// -------------------------------
const SortableLesson = ({ lesson, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-gray-900 p-4 rounded-xl mb-3 border border-gray-700"
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span {...attributes} {...listeners} className="cursor-grab text-gray-400">
            <FaGripLines />
          </span>
          <span className="font-semibold">{lesson.title}</span>
        </div>

        <button
          onClick={() => onDelete(lesson.id)}
          className="text-red-400 hover:text-red-500"
        >
          <FaTrash />
        </button>
      </div>
    </div>
  );
};

// ===============================
// MAIN COMPONENT
// ===============================
const TeacherLessonManager = () => {
  const { id } = useParams();

  const [course, setCourse] = useState(null);
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoType, setVideoType] = useState("youtube");

  // 🔹 NEW CONTENT STATE
  const [contents, setContents] = useState([]);
  const [textContent, setTextContent] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // -------------------------------
  // LOAD COURSE (UNCHANGED)
  // -------------------------------
  useEffect(() => {
    const loadCourse = async () => {
      try {
        const data = await fetchCourseById(id);
        setCourse(data);
      } catch {
        setError("Failed to load course");
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [id]);

  // -------------------------------
  // ADD TEXT CONTENT
  // -------------------------------
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

  // -------------------------------
  // ADD FILE CONTENT
  // -------------------------------
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

  const removeContent = (id) => {
    setContents(contents.filter((c) => c.id !== id));
  };

  // -------------------------------
  // ADD LESSON (EXTENDED ONLY)
  // -------------------------------
  const handleAddLesson = async () => {
    if (!title.trim()) {
      setError("Lesson title required");
      return;
    }

    try {
      await addLesson(id, {
        title,
        videoUrl,
        videoType,
        contents, // ✅ IMPORTANT
      });

      const updated = await fetchCourseById(id);
      setCourse(updated);

      setTitle("");
      setVideoUrl("");
      setVideoType("youtube");
      setContents([]);
      setError("");
    } catch {
      setError("Add lesson failed");
    }
  };

  // -------------------------------
  // DELETE LESSON (UNCHANGED)
  // -------------------------------
  const handleDeleteLesson = async (lessonId) => {
    await deleteLesson(id, lessonId);
    const updated = await fetchCourseById(id);
    setCourse(updated);
  };

  // -------------------------------
  // DRAG & DROP (UNCHANGED)
  // -------------------------------
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = course.lessons.findIndex((l) => l.id === active.id);
    const newIndex = course.lessons.findIndex((l) => l.id === over.id);

    const reordered = arrayMove(course.lessons, oldIndex, newIndex);
    setCourse({ ...course, lessons: reordered });

    await updateLessonOrder(id, reordered);
  };

  // -------------------------------
  // UI STATES
  // -------------------------------
  if (loading)
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-purple-400">Loading...</div>;
  if (error)
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-red-400">{error}</div>;

  // ===============================
  // RENDER
  // ===============================
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-purple-400 mb-6 flex items-center gap-2">
        <FaBook /> Manage Lessons – {course.title}
      </h1>

      {/* ADD LESSON */}
      <div className="bg-gray-800 p-6 rounded-2xl mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FaPlusCircle /> Add Lesson
        </h2>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Lesson title"
          className="w-full p-3 mb-3 rounded-xl bg-gray-900 border border-gray-700"
        />

        <input
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="Video URL (optional)"
          className="w-full p-3 mb-4 rounded-xl bg-gray-900 border border-gray-700"
        />

        {/* 📝 TEXT CONTENT */}
        <textarea
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          placeholder="Lesson notes / explanation"
          className="w-full p-3 rounded-xl bg-gray-900 border border-gray-700 mb-2"
        />
        <button
          onClick={addTextContent}
          className="bg-gray-700 px-4 py-2 rounded mb-4"
        >
          Add Text
        </button>

        {/* 📎 FILE UPLOAD */}
        <input
          type="file"
          accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg,.txt"
          onChange={(e) => handleFileUpload(e.target.files[0])}
          className="mb-4"
        />

        {/* CONTENT LIST */}
        {contents.map((c) => (
          <div
            key={c.id}
            className="flex justify-between items-center bg-gray-900 p-2 rounded mb-2"
          >
            <span>
              {c.type.toUpperCase()} – {c.name || "Text content"}
            </span>
            <button onClick={() => removeContent(c.id)} className="text-red-400">
              <FaTrash />
            </button>
          </div>
        ))}

        <button
          onClick={handleAddLesson}
          className="mt-4 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-bold"
        >
          Add Lesson
        </button>
      </div>

      {/* LESSON LIST */}
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={course.lessons.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          {course.lessons.map((lesson) => (
            <SortableLesson
              key={lesson.id}
              lesson={lesson}
              onDelete={handleDeleteLesson}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default TeacherLessonManager;
