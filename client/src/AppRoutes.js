import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Layouts
import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/AdminDashboardLayout";

// Pages
import Home from "./components/pages/home/Home";
import Login from "./components/pages/Login";
import OnBoardSignUp from "./components/pages/on-board-signup";
import AdminDashboard from "./components/pages/Admin/AdminDashboard";
import UserDashboard from "./components/pages/UserDashboard";
import Trade from "./components/pages/Trade";
import CheckoutPage from "./components/pages/checkout/checkoutPage";
import Contact from "./components/pages/contact";
import ProfilePage from "./components/pages/Profile/page";
import BlogManagement from "./components/pages/Blog";
import BlogCreation from "./components/pages/Blog/createBlog";
import EditBlogModal from "./components/pages/Blog/EditBlogModal";
import ViewBlogModal from "./components/pages/Blog/ViewBlogModal";
import QualifiedPairsList from "./components/pages/scanerStore/QualifiedPairsList";
import ChartPage from "./components/pages/scanerStore/ChartPage";
import NotFound from "./components/pages/404";

// Routes definitions
import { AdminRoutes, UserRoutes } from "./routes.tsx";

export default function AppRoutes() {
  // ✅ Correctly select user from Redux
  const userInfo = useSelector((state) => state.user.user);

  return (
    <Router>
      <ToastContainer style={{ zIndex: 9999 }} />

      <Routes>
        {/* ------------------ Public / Auth Routes ------------------ */}
        {!userInfo ? (
          <>
            <Route element={<AuthLayout />}>
              <Route path="/" element={<Home />} />
            </Route>
            <Route element={<AuthLayout />}>
              <Route path="login" element={<Login />} />
            </Route>
            <Route element={<AuthLayout />}>
              <Route path="signup" element={<OnBoardSignUp />} />
            </Route>
          </>
        ) : (
          <>
            {/* ------------------ Dashboard / Protected Routes ------------------ */}
            <Route
              element={
                <DashboardLayout
                  links={
                    userInfo?.email === "ngiriyezadavid2@gmail.com"
                      ? AdminRoutes
                      : UserRoutes
                  }
                />
              }
            >
              <Route path="/" element={<UserDashboard />} />
              <Route path="/trade" element={<Trade />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/contact" element={<Contact />} />
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
          </>
        )}

        {/* ------------------ Catch-all 404 Route ------------------ */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
