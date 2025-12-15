// ===============================
// models/courseModel.js
// ===============================
export const CourseModel = {
async createCourse(data) {
const ref = await db.collection("courses").add({
...data,
createdAt: admin.firestore.FieldValue.serverTimestamp(),
});
return ref.id;
},


async getAllCourses() {
const snapshot = await db.collection("courses").get();
return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
},


async getCoursesByTeacher(teacherId) {
const snapshot = await db
.collection("courses")
.where("teacherId", "==", teacherId)
.get();
return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
},


async enrollStudent(courseId, userId) {
await db.collection("enrollments").add({
courseId,
userId,
progress: 0,
enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
});
},


async getStudentCourses(userId) {
const snapshot = await db
.collection("enrollments")
.where("userId", "==", userId)
.get();


const courseIds = snapshot.docs.map(d => d.data().courseId);
const courses = await Promise.all(
courseIds.map(id => db.collection("courses").doc(id).get())
);


return courses.map(doc => ({ id: doc.id, ...doc.data() }));
},
};