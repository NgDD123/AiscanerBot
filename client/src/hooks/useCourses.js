// ===============================
// src/hooks/useCourses.js
// ===============================
import { useEffect, useState } from "react";
import {
fetchAllCourses,
fetchMyCourses,
createCourse,
enrollCourse,
} from "../servece/courseService";


export const useCourses = (role) => {
const [courses, setCourses] = useState([]);
const [loading, setLoading] = useState(true);


useEffect(() => {
const load = async () => {
setLoading(true);
const data = role ? await fetchMyCourses() : await fetchAllCourses();
setCourses(data);
setLoading(false);
};
load();
}, [role]);


return {
courses,
loading,
createCourse: async (data) => {
await createCourse(data);
setCourses(await fetchMyCourses());
},
enrollCourse: async (courseId) => {
await enrollCourse(courseId);
setCourses(await fetchMyCourses());
},
};
};