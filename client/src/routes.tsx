import { RxDashboard } from "react-icons/rx";
import { RiAdminFill } from "react-icons/ri";
import { FaBitcoin } from "react-icons/fa";
import { MdPayments } from "react-icons/md";
import { CgProfile } from "react-icons/cg";
import { TfiWrite } from "react-icons/tfi";

export const AdminRoutes = [
    {
        name: "Home",
        path: "/",
        icon: RxDashboard,
        isActive: true
    },
    ,
    {
        name: "Admin",
        path: "/admin",
        icon: RiAdminFill,
        isActive: false
    },
    {
        name: "Trade",
        path: "/trade",
        icon: FaBitcoin,
        isActive: false
    },
    {
        name: "Profile",
        path: "/profile",
        icon: CgProfile,
        isActive: false
    },
    {
        name: "Blog",
        path: "/blog",
        icon: TfiWrite,
        isActive: false
    }

]


export const UserRoutes = [
    {
        name: "Home",
        path: "/",
        icon: RxDashboard,
        isActive: true
    },

    {
        name: "Trade",
        path: "/trade",
        icon: FaBitcoin,
        isActive: false
    },
    {
        name: "Profile",
        path: "/profile",
        icon: CgProfile,
        isActive: false
    }
]