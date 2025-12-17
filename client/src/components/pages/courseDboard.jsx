// ===============================
// src/pages/dashboard/Dashboard.jsx
// ===============================
import { useEffect, useState } from "react";
import { fetchAllCourses } from "../../servece/courseService"; // ✅ FIXED PATH
import CourseCard from "../../components/courses/CourseCard";

const Dashboard = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const data = await fetchAllCourses();

        // ✅ GUARANTEE ARRAY
        setCourses(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load courses", err);
        setError("Failed to load courses");
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  // ⏳ LOADING
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-purple-400 flex items-center justify-center">
        Loading courses...
      </div>
    );
  }

  // ❌ ERROR
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-red-400 flex items-center justify-center">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6 text-purple-400">
        Available Courses
      </h1>

      {courses.length === 0 ? (
        <p className="text-gray-400">No courses available.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
