import { useState } from "react";
import AuthNavbar from "../components/Navbar/AuthNavbar";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useEffect } from "react";
import { auth } from "../firebase";
import { Outlet } from "react-router-dom";
import Footer from "../components/Foot/footer";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/slice/userSlice";

const AuthLayout = () => {
    const [user, setUser] = useState({});
    const dispatch = useDispatch();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    const handleAuthentication = async () => {
        if (user) {
            dispatch(logout())

            signOut(auth);
            setUser(null);
            window.location.href = '/'
        }
        else {
            window.location.href = '/signup';
        }
    };
    const userInfo = useSelector((state) => state?.user?.user?.user)

    return (
        <main className="w-full  flex flex-col gap-y-6 max-w-[125rem] bg-gradient-to-bl from-major-text-style from-[30%] via-minor-text-style via-[50%] to-black">
            <div className="w-full flex justify-center">
                <AuthNavbar action={!userInfo ? 'Sign In' : 'Sign Out'} onClick={handleAuthentication} />
            </div>

            <div className="w-[96%] mx-auto mt-20">
                <Outlet />
            </div>
            <Footer />
        </main>
    )
}
export default AuthLayout;