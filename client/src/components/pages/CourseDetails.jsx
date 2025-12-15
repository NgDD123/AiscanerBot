// ===============================
// src/pages/courses/CourseDetails.jsx
// ===============================
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaBook } from "react-icons/fa";
import LessonPlayer from "./LessonPlayer";

const CourseDetails = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);

  useEffect(() => {
    // MOCK DATA (replace with API later)
    setCourse({
      id,
      title: "Stock Market Mastery",
      description:
        "Learn professional stock market trading, investing strategies, and risk management.",
      lessons: [
        {
          id: "l1",
          title: "Introduction to Stock Market",
          videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
        },
        {
          id: "l2",
          title: "Understanding Charts",
          videoUrl: "https://www.w3schools.com/html/movie.mp4",
        },
        {
          id: "l3",
          title: "Risk Management",
          videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
        },
      ],
    });
  }, [id]);

  if (!course) {
    return <div className="text-white p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 grid lg:grid-cols-4 gap-6">
      {/* LEFT: LESSON LIST */}
      <div className="bg-gray-800 rounded-2xl p-4">
        <h2 className="text-xl font-bold text-purple-400 flex items-center gap-2 mb-4">
          <FaBook /> Lessons
        </h2>

        {course.lessons.map((lesson) => (
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
        <p className="text-gray-400 mb-6">{course.description}</p>

        {currentLesson ? (
          <LessonPlayer lesson={currentLesson} course={course} />
        ) : (
          <div className="text-gray-400">
            Select a lesson to start learning 🚀
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetails;
