import { enrollCourse } from "../../servece/courseService";

const CourseCard = ({ course }) => {
  const handleEnroll = async () => {
    try {
      await enrollCourse(course.id);
      alert("✅ Enrolled successfully!");
    } catch (err) {
      alert("❌ Enrollment failed");
      console.error(err);
    }
  };

  return (
    <div className="border rounded-xl p-4 shadow-sm bg-white">
      <h2 className="text-lg font-semibold">{course.title}</h2>

      <p className="text-sm text-gray-600 mt-2">
        Lessons: {course.lessons?.length || 0}
      </p>

      <button
        onClick={handleEnroll}
        className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
      >
        Enroll
      </button>
    </div>
  );
};

export default CourseCard;
