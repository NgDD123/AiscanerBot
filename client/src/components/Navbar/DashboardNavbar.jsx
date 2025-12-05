import { useContext } from "react";
import { IoMenu } from "react-icons/io5";
import { CiGlobe } from "react-icons/ci";
import { FaRegBell } from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { logout } from "../../redux/slice/userSlice";

import NavLinks from "./NavLinks"; // adjust path if needed
import Logo from "../Logo";
import SearchBar from "../Search";
import ProfileCard from "../Profile";
import { NotificationButton } from "../Button";
import { Appcontext } from "../../contexts/AppContext";

const DashboardNavigationBar = ({ profileInfo }) => {
  const { handleOpenSidebar } = useContext(Appcontext);
  const dispatch = useDispatch();
  const userInfo = profileInfo;

  // Handle Sign In / Sign Out
  const handleAuthClick = () => {
    if (userInfo) {
      dispatch(logout());
      signOut(auth);
      window.location.href = "/";
    } else {
      window.location.href = "/login";
    }
  };

  return (
    <div className="glass_morphism border-gray-border border-b-[0.6px] min-h-[60px] px-6 w-full flex items-center gap-6 z-20 relative">

      {/* LEFT */}
      <div className="flex items-center gap-x-6 shrink-0">
        <div
          className="md:hidden w-10 h-10 flex items-center justify-center"
          onClick={handleOpenSidebar}
        >
          <IoMenu className="text-4xl text-white" />
        </div>
        <Logo />
      </div>

      {/* CENTER NAV LINKS */}
      <div className="flex-1 flex justify-center">
        <NavLinks profileInfo={profileInfo} />
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-x-4 shrink-0">

        <SearchBar />

        <NotificationButton icon={CiGlobe} />
        <NotificationButton icon={FaRegBell} />

        {userInfo ? (
          // Logged-in: show profile card + Sign Out button
          <>
            <ProfileCard username={userInfo.username} email={userInfo.email} />
            <button
              onClick={handleAuthClick}
              className="bg-red-600 text-white px-3 py-1 rounded-2xl text-sm hover:bg-red-500 transition"
            >
              Sign Out
            </button>
          </>
        ) : (
          // Guest: show Sign In button
          <button
            onClick={handleAuthClick}
            className="bg-purple-600 text-white px-4 py-1 rounded-2xl text-sm hover:bg-purple-500 transition"
          >
            Sign In
          </button>
        )}

      </div>
    </div>
  );
};

export default DashboardNavigationBar;
