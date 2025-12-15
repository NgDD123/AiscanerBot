import { useEffect, useState } from "react";

const useCourseProgress = (courseId) => {
  const [progress, setProgress] = useState({
    completedLessons: [],
    percent: 0,
  });

  useEffect(() => {
    const saved = localStorage.getItem(`progress-${courseId}`);
    if (saved) setProgress(JSON.parse(saved));
  }, [courseId]);

  const markCompleted = (lessonId) => {
    setProgress((prev) => {
      if (prev.completedLessons.includes(lessonId)) return prev;

      const completedLessons = [...prev.completedLessons, lessonId];
      const percent = Math.round((completedLessons.length / 3) * 100);

      const updated = { completedLessons, percent };
      localStorage.setItem(
        `progress-${courseId}`,
        JSON.stringify(updated)
      );
      return updated;
    });
  };

  return { progress, markCompleted };
};

export default useCourseProgress;
