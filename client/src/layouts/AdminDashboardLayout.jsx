import { useContext, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import DashboardNavigationBar from "../components/Navbar/DashboardNavbar";
import SidebarComponent from "../components/Sidebar";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Appcontext } from "../contexts/AppContext";
import MobileSidebar from "../components/Sidebar/Mobile";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/slice/userSlice";

const DashboardLayout = (props) => {

    const [user, setUser] = useState({});
    const dispatch = useDispatch();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    const userInfo = useSelector((state) => state?.user?.user?.user);
    const handleAuthentication = async () => {
        if (user) {
            dispatch(logout())
            signOut(auth);
            setUser(null);
            window.location.replace("/signup")
        }
    };

    const { isTabletMode, isSideBarModalOpen, handleCloseSidebarModal } = useContext(Appcontext)

    return (
        <main className="w-full flex  h-screen bg-minor-text-style max-w-[115rem] mx-auto overflow-y-scroll ">
            <div className="hidden md:block w-[16%] ">
                <SidebarComponent  onClick={handleAuthentication} links={props.links} />
            </div>
            <div className="block md:hidden">
                <MobileSidebar onClick={handleAuthentication} mobileItems={props.links} />
            </div>
            <section className="w-full md:w-[86%] h-full flex flex-col ">
                <DashboardNavigationBar profileInfo={userInfo} />
                <div className="h-[85%] overflow-y-scroll p-8 bg-minor-text-style ">
                    <Outlet />

                </div>
            </section>

        </main>

    )

}
export default DashboardLayout;