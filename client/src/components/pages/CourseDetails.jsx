// ===============================
// src/pages/courses/CourseDetails.jsx
// ===============================
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaBook } from "react-icons/fa";
import LessonPlayer from "./LessonPlayer";
import { fetchCourseById } from "../../servece/courseService";

const CourseDetails = () => {
  const { id } = useParams(); // ✅ THIS MUST EXIST
  const [course, setCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
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

        if (data?.lessons?.length > 0) {
          setCurrentLesson(data.lessons[0]);
        }
      } catch (err) {
        console.error("Failed to load course", err);
        setError("Failed to load course details.");
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [id]);

  // ⏳ LOADING
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-purple-400 text-xl">
        Loading course...
      </div>
    );
  }

  // ❌ ERROR
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-red-400 text-lg">
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
    <div className="min-h-screen bg-gray-900 text-white p-6 grid lg:grid-cols-4 gap-6">
      {/* LEFT: LESSON LIST */}
      <div className="bg-gray-800 rounded-2xl p-4">
        <h2 className="text-xl font-bold text-purple-400 flex items-center gap-2 mb-4">
          <FaBook /> Lessons
        </h2>

        {course.lessons?.map((lesson) => (
          <button
            key={lesson.id}
            onClick={() => setCurrentLesson(lesson)}
            className={`w-full text-left p-3 rounded-xl mb-2 transition ${
              currentLesson?.id === lesson.id
                ? "bg-purple-600"
                : "bg-gray-900 hover:bg-gray-700"
            }`}
          >
            {lesson.title}
          </button>
        ))}
      </div>

      {/* RIGHT: PLAYER */}
      <div className="lg:col-span-3 bg-gray-800 rounded-2xl p-6">
        <h1 className="text-3xl font-bold text-purple-300 mb-2">
          {course.title}
        </h1>

        {currentLesson ? (
          <LessonPlayer lesson={currentLesson} course={course} />
        ) : (
          <div className="text-gray-400">
            No lessons available for this course.
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetails;
