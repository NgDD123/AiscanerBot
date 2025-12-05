import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { auth } from "../firebase";
import { logout } from "../redux/slice/userSlice";

import DashboardNavigationBar from "../components/Navbar/DashboardNavbar";
import Footer from "../components/Foot/footer";

const AuthLayout = () => {
  const [user, setUser] = useState(null);
  const dispatch = useDispatch();
  const userInfo = useSelector((state) => state?.user?.user?.user);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleAuthentication = async () => {
    if (userInfo) {
      dispatch(logout());
      signOut(auth);
      setUser(null);
      window.location.href = "/";
    } else {
      window.location.href = "/signup";
    }
  };

  return (
    <main className="w-full flex flex-col gap-y-6 max-w-[125rem] bg-gradient-to-bl from-major-text-style from-[30%] via-minor-text-style via-[50%] to-black">
      
      {/* Dashboard Navbar replaces AuthNavbar */}
      <DashboardNavigationBar profileInfo={userInfo || null} />

      {/* Page Content */}
      <div className="w-[96%] mx-auto mt-20">
        <Outlet />
      </div>

      <Footer />
    </main>
  );
};

export default AuthLayout;
