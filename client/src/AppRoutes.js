import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import AdminDashboard from "./components/pages/Admin/AdminDashboard";
import UserDashboard from "./components/pages/UserDashboard";
import CheckoutPage from "./components/pages/checkout/checkoutPage";
import Contact from "./components/pages/contact";
import About from "./components/pages/aboutUs";
import Home from "./components/pages/home/Home";
import Trade from "./components/pages/Trade";
import Login from "./components/pages/Login";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import OnBoardSignUp from "./components/pages/on-board-signup";
import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/AdminDashboardLayout";
import { AdminRoutes, UserRoutes } from "./routes.tsx";
import { useSelector } from "react-redux";
import NotFound from "./components/pages/404";
import ProfilePage from "./components/pages/Profile/page";
import BlogManagement from "./components/pages/Blog";
import BlogCreation from "./components/pages/Blog/createBlog";
import EditBlogModal from "./components/pages/Blog/EditBlogModal";
import ViewBlogModal from "./components/pages/Blog/ViewBlogModal";
import QualifiedPairsList from "./components/pages/scanerStore/QualifiedPairsList";
import ChartPage from "./components/pages/scanerStore/ChartPage";
import FinancialCourses from "./components/pages/FinancialCourses"
import TradingTips from "./components/pages/TradingTips";
import CoursesDashboard from "./components/pages/CoursesDashboard";
import CoursesDashboord from "./components/pages/courseDboard";
import TeacherCourses from "./components/pages/TeacherCourses";
import StudentCourses from "./components/pages/StudentCourses";
import CourseDetails from "./components/pages/CourseDetails";
function AppRoutes() {
  const userInfo = useSelector((state) => state?.user?.user?.user);


  return (
    <Router>
      <ToastContainer style={{ zIndex: 9999 }} />
      <Routes>

        {/* Auth routes */}
        {
          !userInfo ?
            <Route element={<AuthLayout />}>
              <Route path="/" element={<Home />} />
            </Route>
            :
            <Route element={<DashboardLayout links={(userInfo?.email === "ngiriyezadavid2@gmail.com") ? AdminRoutes : UserRoutes} />}>
              <Route path="/" element={<UserDashboard />} />

            </Route>
        }
        <Route element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
        </Route>
        <Route element={<AuthLayout />}>
          <Route path="signup" element={<OnBoardSignUp />} />
        </Route>
        <Route element={<AuthLayout/>}>
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          <Route path="/about" element={<About />} />
          <Route path="/courses" element={<FinancialCourses/>}/>
           <Route path="/tips" element={<TradingTips/>}/>
           {/* <Route path ="/courses" element = {<CoursesDashboard/>}/> */}
           <Route path = "/course" element = {<CoursesDashboord/>}/>
           <Route path="/my-courses" element={<StudentCourses />} />
           <Route path="/teach-courses" element={<TeacherCourses />} />
           <Route path="/course/:id" element={<CourseDetails />} />

        </Route>

        {/* Admin routes  */}
        <Route element={<DashboardLayout links={(userInfo?.email === "ngiriyezadavid2@gmail.com") ? AdminRoutes : UserRoutes} />}>

          <Route path="/trade" element={<Trade />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/user" element={<UserDashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/blog" element={<BlogManagement />} />
          <Route path="/blog-create" element={<BlogCreation />} />
          <Route path="/blog-update/:blogId" element={<EditBlogModal />} />
          <Route path="/blog-read/:blogId" element={<ViewBlogModal />} />
          <Route path="/qualified-pairs" element={<QualifiedPairsList />} />
          <Route path="/trade-chart" element={<ChartPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />



      </Routes>
    </Router>
  );
}

export default AppRoutes;
