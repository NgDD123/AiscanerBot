import Logo from "../Logo";
import { CtaButton } from "../Button";

const AuthNavbar = ({ action, onClick }) => {
  return (
    <header className="
      fixed top-0 left-0 w-full z-30
      backdrop-blur-xl bg-[#0a0a0acc]
      px-6 py-3 shadow-lg border-b border-white/10
    ">
      <div className="flex justify-between items-center w-[97%] mx-auto">

        <Logo />

        <CtaButton
          text={action}
          isAuth={false}
          onClick={onClick}
          className="leading-6 font-bold py-3 px-6 bg-major-text-style rounded-xl"
        />
      </div>
    </header>
  );
};

export default AuthNavbar;
