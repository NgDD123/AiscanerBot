import React, { useContext, useState, useEffect } from "react";
import { IoCloseOutline } from "react-icons/io5";
import { Appcontext } from "../../../contexts/AppContext";
import { useLocation, useNavigate } from "react-router-dom";
import { CtaButton } from "../../Button";

import Logo from "../../Logo";
import NavigationLink from "../../Navlink";
import { FiLogOut } from "react-icons/fi";
import { useAuth } from "../../pages/AuthContext";
const MobileSidebar = (props) => {
  const [activeLink, setActiveLink] = useState("");
  const router = useNavigate();

  const handleNavigation = (link) => {
    setActiveLink(link.name);
    router(link.path, { replace: true });
  };
  const location = useLocation();
  useEffect(() => {
    setActiveLink(location.pathname.split("/")[1]);
  }, [location.pathname]);

  const { isSideBarOpen, handleCloseSidebar } = useContext(Appcontext);
  const { userPaymentStatus } = useAuth();
  const handlePayment = () => {
    window.location.replace("/checkout");
  };

  return (
    <div
      className={`fixed left-0 top-0 z-50 flex h-screen w-full transition-transform duration-500 ease-in ${isSideBarOpen ? "translate-x-0" : "-translate-x-full"} lg:hidden`}
    >
      <div
        className={`z-50 flex h-screen w-[50%] flex-col gap-8 rounded-r-2xl bg-major-text-style px-4 py-6`}
      >
        {
          <>
            <div className="flex justify-between">
              <div className="flex items-center gap-x-3">
                <Logo />
              </div>
              <div
                className="rounded-full bg-white border border-darkGray p-2"
                onClick={handleCloseSidebar}
              >
                <IoCloseOutline className="text-darkGray" size={24} />
              </div>
            </div>
            <div className="h-[80%] flex flex-col justify-between">
              <div className="features-list flex flex-col gap-y-2">
                {props.mobileItems.map((route, index) => {
                  return (
                    <NavigationLink
                      key={index}
                      icon={route.icon}
                      path={route.path}
                      name={route.name}
                      isActive={activeLink == route.name}
                      onClick={() => handleNavigation(route)}
                    />
                  );
                })}
              </div>
              <div className="flex flex-col gap-y-2">
                {userPaymentStatus?.needsToPay && (
                  <div
                    onClick={handlePayment}
                    className="glass_morphism flex justify-center items-center p-1 rounde-lg font-bold text-[#ca217ebb] hover:cursor-pointer "
                  >
                    Upgrade to Pro
                  </div>
                )}
                <div className="gap-x-4 flex items-baseline justify-start">
                  <CtaButton
                    text={"Logout"}
                    isAuth={false}
                    onClick={props.onClick}
                    className={"bg-[#ca217ebb]"}
                  />
                  <FiLogOut className="text-[#ca217ebb] text-xl" />
                </div>
              </div>
            </div>
          </>
        }
      </div>
      <div
        className={`h-full  w-[40%] backdrop-blur-[2px] transition-none ${isSideBarOpen ? "" : "backdrop-blur-0"}`}
        onClick={handleCloseSidebar}
      ></div>
    </div>
  );
};
export default MobileSidebar;
