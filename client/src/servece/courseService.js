// ===============================
// src/services/courseService.js
// ===============================
import axios from "axios";
import { getAuth } from "firebase/auth";

const API_BASE = "http://localhost:8001/api/courses"; // change in production

// -------------------------------
// AUTH TOKEN
// -------------------------------
const getToken = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return await user.getIdToken();
};

// -------------------------------
// COURSES
// -------------------------------
export const fetchAllCourses = async () => {
  const res = await axios.get(API_BASE);
  return res.data;
};

export const fetchMyCourses = async () => {
  const token = await getToken();
  const res = await axios.get(API_BASE, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const fetchCourseById = async (courseId) => {
  const token = await getToken();
  const res = await axios.get(`${API_BASE}/${courseId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const createCourse = async (courseData) => {
  const token = await getToken();
  const res = await axios.post(`${API_BASE}/create`, courseData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const enrollCourse = async (courseId) => {
  const token = await getToken();
  const res = await axios.post(
    `${API_BASE}/enroll`,
    { courseId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

// -------------------------------
// LESSONS
// -------------------------------
export const addLesson = async (courseId, lessonData) => {
  const token = await getToken();
  const res = await axios.post(
    `${API_BASE}/${courseId}/lessons`,
    lessonData,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export const deleteLesson = async (courseId, lessonId) => {
  const token = await getToken();
  const res = await axios.delete(
    `${API_BASE}/${courseId}/lessons/${lessonId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

// -------------------------------
// 🔄 REORDER LESSONS (DRAG & DROP)
// -------------------------------
export const updateLessonOrder = async (courseId, lessons) => {
  const token = await getToken();
  const res = await axios.put(
    `${API_BASE}/${courseId}/lessons/reorder`,
    { lessons },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

// -------------------------------
// 🚀 PUBLISH / UNPUBLISH COURSE
// -------------------------------
export const togglePublish = async (courseId, published) => {
  const token = await getToken();
  const res = await axios.put(
    `${API_BASE}/${courseId}/publish`,
    { published },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};
