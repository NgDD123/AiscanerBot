import { useEffect, useState } from "react";
import { fetchAllCourses } from "../../servece/courseService";
import CourseCard from "../../components/courses/CourseCard";

const Dashboord = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const data = await fetchAllCourses();
        setCourses(data);
      } catch (err) {
        console.error("Failed to load courses", err);
      } finally {
        setLoading(false);
      }
    };
    loadCourses();
  }, []);

  if (loading) return <p>Loading courses...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Available Courses</h1>

      {courses.length === 0 && <p>No courses available.</p>}

      <div className="grid md:grid-cols-3 gap-4">
        {courses.map(course => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
};

export default Dashboord;
