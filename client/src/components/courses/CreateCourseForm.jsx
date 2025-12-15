import { useState } from "react";
import { createCourse } from "../../servece/courseService";

const CreateCourseForm = ({ onCreated }) => {
  const [title, setTitle] = useState("");
  const [lessons, setLessons] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createCourse({
        title,
        lessons: lessons.split(",").map(l => l.trim()),
      });

      alert("✅ Course created!");
      setTitle("");
      setLessons("");
      onCreated?.();
    } catch (err) {
      alert("❌ Failed to create course");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border p-4 rounded-xl bg-white">
      <h2 className="text-lg font-bold mb-3">Create Course</h2>

      <input
        className="border p-2 w-full mb-2"
        placeholder="Course title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
      />

      <textarea
        className="border p-2 w-full mb-2"
        placeholder="Lessons (comma separated)"
        value={lessons}
        onChange={e => setLessons(e.target.value)}
        required
      />

      <button
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded-lg w-full"
      >
        {loading ? "Creating..." : "Create Course"}
      </button>
    </form>
  );
};

export default CreateCourseForm;
