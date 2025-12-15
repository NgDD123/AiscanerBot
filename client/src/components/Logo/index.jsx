import { Link } from "react-router-dom";
import freedomLog from "../../assets/freedomlog.jpg";
const Logo = () => {
  return (
    <div className="flex items-center gap-x-4">
      <img className="w-[40px]" src={freedomLog} alt="Logo" />
      <Link
        to={"/"}
        className="hidden md:block text-white text-[26px] leading-[38.73px] font-bold"
      >
        Freedom Bot
      </Link>
    </div>
  );
};
export default Logo;
