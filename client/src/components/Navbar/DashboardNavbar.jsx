import { useContext } from "react";
import { IoMenu } from "react-icons/io5";
import { CiGlobe } from "react-icons/ci";
import { FaRegBell } from "react-icons/fa";
import { signOut } from "firebase/auth";
import { useDispatch } from "react-redux";

import { auth } from "../../firebase";
import { logout } from "../../redux/slice/userSlice";

import Logo from "../Logo";
import NavLinks from "./NavLinks";
import SearchBar from "../Search";
import ProfileCard from "../Profile";
import { NotificationButton } from "../Button";
import { Appcontext } from "../../contexts/AppContext";

const DashboardNavigationBar = ({ profileInfo }) => {
  const { handleOpenSidebar } = useContext(Appcontext);
  const dispatch = useDispatch();
  const userInfo = profileInfo;

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
    <header className="
      fixed top-0 left-0 w-full z-40
      backdrop-blur-lg bg-[#0a0a0ab3]
      border-b border-[#ffffff1a]
      px-6 py-3 flex items-center gap-6
      shadow-[0_4px_16px_rgba(0,0,0,0.25)]
    ">
      
      {/* Left side */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Mobile menu */}
        <button
          onClick={handleOpenSidebar}
          className="md:hidden p-2 rounded-lg hover:bg-white/10 transition"
        >
          <IoMenu className="text-3xl text-white" />
        </button>

        <Logo />
      </div>

      {/* Center links (desktop only) */}
      <nav className="hidden md:flex flex-1 justify-center">
        <NavLinks profileInfo={profileInfo} />
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-4 shrink-0">

        <div className="hidden md:block">
          <SearchBar />
        </div>

        <NotificationButton icon={CiGlobe} />
        <NotificationButton icon={FaRegBell} />

        {userInfo ? (
          <>
            <ProfileCard username={userInfo.username} email={userInfo.email} />
            <button
              onClick={handleAuthClick}
              className="
                px-4 py-1.5 rounded-xl text-sm
                bg-red-600 hover:bg-red-500
                text-white transition font-semibold
              "
            >
              Sign Out
            </button>
          </>
        ) : (
          <button
            onClick={handleAuthClick}
            className="
              px-5 py-1.5 rounded-xl text-sm
              bg-purple-600 hover:bg-purple-500
              text-white transition font-semibold
            "
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};

export default DashboardNavigationBar;
