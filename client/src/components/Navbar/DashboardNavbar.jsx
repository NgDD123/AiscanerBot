import { CiGlobe } from "react-icons/ci";
import { FaRegBell } from "react-icons/fa";
import { NotificationButton } from "../Button";
import Logo from "../Logo";
import ProfileCard from "../Profile";
import SearchBar from "../Search";
import "../pages/on-board.css";
import { useContext } from "react";
import { Appcontext } from "../../contexts/AppContext";
import { IoMenu } from "react-icons/io5";

const DashboardNavigationBar = ({ profileInfo }) => {
  const { handleOpenSidebar, isTabletMode } = useContext(Appcontext);
  return (
    <div className="glass_morphism border-gray-border border-b-[0.6px] min-h-[60px] pl-[30px] w-full flex justify-between items-center z-20">
      <div className="flex  gap-x-8">
        <div
          className="md:hidden w-10 h-10 rounded-md flex items-center justify-center"
          onClick={handleOpenSidebar}
        >
          <IoMenu className="text-4xl text-white" />
        </div>
        <div className="md:hidden flex justify-between items-center">
          <Logo />
        </div>
      </div>

      <div className="basis-1/2 flex items-center justify-evenly">
        <SearchBar />
        <NotificationButton icon={CiGlobe} onClick={() => {}} />
        <NotificationButton icon={FaRegBell} onClick={() => {}} />
        <ProfileCard
          email={profileInfo?.email}
          username={profileInfo?.username}
        />
      </div>
    </div>
  );
};
export default DashboardNavigationBar;
