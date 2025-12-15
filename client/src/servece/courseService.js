// ===============================
// src/services/courseService.js
// ===============================
import axios from "axios";
import { getAuth } from "firebase/auth";


const API_BASE = "http://localhost:8001/api/courses"; // change in production


const getToken = async () => {
const auth = getAuth();
const user = auth.currentUser;
if (!user) throw new Error("Not authenticated");
return await user.getIdToken();
};


export const fetchAllCourses = async () => {
const res = await axios.get(API_BASE);
return res.data;
};


export const fetchMyCourses = async () => {
const token = await getToken();
const res = await axios.get(`${API_BASE}`, {
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