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
  togglePublish,
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

import { FaBook, FaPlusCircle, FaTrash, FaGripLines } from "react-icons/fa";

// -------------------------------
// Sortable Lesson Item
// -------------------------------
const SortableLesson = ({ lesson, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: lesson.id });

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
          <span
            {...attributes}
            {...listeners}
            className="cursor-grab text-gray-400"
          >
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

      {/* 🎥 VIDEO PREVIEW */}
      {lesson.videoUrl && (
        <div className="mt-4">
          {lesson.videoType === "youtube" ? (
            <iframe
              className="w-full h-[220px] rounded-xl border border-gray-700"
              src={lesson.videoUrl.replace("watch?v=", "embed/")}
              allowFullScreen
              title={lesson.title}
            />
          ) : (
            <video
              controls
              className="w-full rounded-xl border border-gray-700"
              src={lesson.videoUrl}
            />
          )}
        </div>
      )}

      {/* ===============================
          📚 LESSON CONTENTS (ADDED)
         =============================== */}
      {lesson.contents?.length > 0 && (
        <div className="mt-6 space-y-4">
          <h4 className="text-purple-400 font-semibold">Lesson Materials</h4>

          {lesson.contents.map((c, i) => (
            <div key={i} className="bg-gray-800 p-3 rounded-lg">
              {/* TEXT */}
              {c.type === "text" && (
                <p className="text-gray-300 whitespace-pre-wrap">
                  {c.value}
                </p>
              )}

              {/* IMAGE */}
              {c.type === "image" && (
                <img
                  src={c.value}
                  alt="Lesson"
                  className="rounded-lg max-h-96"
                />
              )}

              {/* PDF / PPT / FILE */}
              {(c.type === "pdf" ||
                c.type === "ppt" ||
                c.type === "file") && (
                <a
                  href={c.value}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 underline"
                >
                  Open {c.type.toUpperCase()}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // -------------------------------
  // LOAD COURSE
  // -------------------------------
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
      } catch {
        setError("Failed to load course");
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [id]);

  // -------------------------------
  // ADD LESSON
  // -------------------------------
  const handleAddLesson = async () => {
    if (!title.trim() || !videoUrl.trim()) {
      setError("Lesson title and video URL required");
      return;
    }

    try {
      await addLesson(id, { title, videoUrl, videoType });
      const updated = await fetchCourseById(id);
      setCourse(updated);
      setTitle("");
      setVideoUrl("");
      setVideoType("youtube");
      setError("");
    } catch {
      setError("Add lesson failed");
    }
  };

  // -------------------------------
  // DELETE LESSON
  // -------------------------------
  const handleDeleteLesson = async (lessonId) => {
    try {
      await deleteLesson(id, lessonId);
      const updated = await fetchCourseById(id);
      setCourse(updated);
    } catch {
      setError("Delete lesson failed");
    }
  };

  // -------------------------------
  // DRAG & DROP
  // -------------------------------
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = course.lessons.findIndex(l => l.id === active.id);
    const newIndex = course.lessons.findIndex(l => l.id === over.id);

    const reordered = arrayMove(course.lessons, oldIndex, newIndex);

    setCourse({ ...course, lessons: reordered });
    await updateLessonOrder(id, reordered);
  };

  // -------------------------------
  // PUBLISH TOGGLE
  // -------------------------------
  const handlePublishToggle = async () => {
    await togglePublish(id, !course.published);
    setCourse({ ...course, published: !course.published });
  };

  // -------------------------------
  // UI STATES
  // -------------------------------
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

  // ===============================
  // RENDER
  // ===============================
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-purple-400 flex items-center gap-2">
          <FaBook /> Manage Lessons – {course.title}
        </h1>

        <button
          onClick={handlePublishToggle}
          className={`px-4 py-2 rounded-xl font-bold ${
            course.published ? "bg-red-600" : "bg-green-600"
          }`}
        >
          {course.published ? "Unpublish" : "Publish"}
        </button>
      </div>

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

        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={course.lessons.map(l => l.id)}
            strategy={verticalListSortingStrategy}
          >
            {course.lessons?.map((lesson) => (
              <SortableLesson
                key={lesson.id}
                lesson={lesson}
                onDelete={handleDeleteLesson}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};

export default TeacherLessonManager;
