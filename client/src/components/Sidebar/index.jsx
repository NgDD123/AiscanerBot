import { FiLogOut } from "react-icons/fi";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavigationLink from "../Navlink";
import Logo from "../Logo";
import { CtaButton } from "../Button";
import { useAuth } from "../pages/AuthContext";

const SidebarComponent = (props) => {
  const handlePayment = () => {
    window.location.replace("/checkout");
  };

  const router = useNavigate();
  const [activeLLink, setActiveLink] = useState("");
  const handleNavigation = (link) => {
    setActiveLink(link.name);
    router(link.path, { replace: true });
  };
  const { userPaymentStatus } = useAuth();

  return (
    <div className="bg-major-text-style flex flex-col w-full p-4 justify-between h-screen">
      <div className="flex flex-col w-full gap-y-[21px] ">
        {/**Log section */}
        <Logo />
        <div className="flex flex-col gap-y-2">
          {props.links.map((link, index) => (
            <NavigationLink
              key={index}
              icon={link.icon}
              name={link.name}
              isActive={activeLLink == link.name}
              path={link.path}
              onClick={() => handleNavigation(link)}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-y-2">
        {userPaymentStatus?.needsToPay && (
          <div
            onClick={handlePayment}
            className="glass_morphism flex justify-center items-center p-1 rounde-lg font-bold text-[#b11b6dbb] hover:cursor-pointer "
          >
            Upgrade to Pro
          </div>
        )}
        <div className="gap-x-4 flex items-baseline justify-start">
          <CtaButton
            text={"Logout"}
            isAuth={false}
            onClick={props.onClick}
            className={"bg-[#b11b6dbb]"}
          />
          <FiLogOut className="text-[#b11b6dbb] text-xl" />
        </div>
      </div>
    </div>
  );
};
export default SidebarComponent;
