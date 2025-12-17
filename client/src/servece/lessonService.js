import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";

export const fetchLessons = async (courseId) => {
  const snap = await getDocs(
    collection(db, "courses", courseId, "lessons")
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const createLesson = async (courseId, lesson) => {
  await addDoc(collection(db, "courses", courseId, "lessons"), lesson);
};

export const deleteLesson = async (courseId, lessonId) => {
  await deleteDoc(
    doc(db, "courses", courseId, "lessons", lessonId)
  );
};
