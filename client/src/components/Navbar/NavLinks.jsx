import { Link } from "react-router-dom";
import { useState } from "react";
import { FaChevronDown, FaBars, FaTimes } from "react-icons/fa";

const NavLinks = ({ profileInfo }) => {
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Guest links
  const guestMenus = [
    { title: "Home", path: "/" },
    { title: "Trading Tips", path: "/tips" },
    { title: "Chart", path: "/trade-chart" },
    { title: "About Us", path: "/about" },
    { title: "Contact Us", path: "/contact" },
  ];

  // Signed-in user links (example dropdown for Trade/Futures)
  const userMenus = [
    {
      title: "Trade",
      items: [
        { name: "Trade Futures", path: "/trade" },
        { name: "Trade Charts", path: "/trade-chart" },
      ],
    },
    {
      title: "Resources",
      items: [
        { name: "Trading Tips", path: "/tips" },
        { name: "Analysis Tools", path: "/analysis" },
      ],
    },
  ];

  const menusToShow = profileInfo ? userMenus : guestMenus;

  return (
    <>
      {/* Desktop Menu */}
      <div className="hidden md:flex items-center gap-x-8">
        {menusToShow.map((menu, index) => {
          if (menu.items) {
            return (
              <div
                key={index}
                className="relative group"
                onMouseEnter={() => setOpenMenu(index)}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <button className="text-white text-[15px] flex items-center gap-1 hover:text-purple-400 transition">
                  {menu.title}
                  <FaChevronDown className="text-[10px]" />
                </button>

                {/* Dropdown */}
                {openMenu === index && (
                  <div className="absolute left-0 mt-3 bg-[#151515] border border-gray-700 rounded-lg shadow-lg py-3 w-44 z-50 animate-fade-in">
                    {menu.items.map((item) => (
                      <Link
                        key={item.name}
                        to={item.path}
                        className="block px-4 py-2 text-white hover:bg-purple-600 hover:pl-5 transition-all"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={index}
              to={menu.path}
              className="text-white text-[15px] hover:text-purple-400 transition"
            >
              {menu.title}
            </Link>
          );
        })}
      </div>

      {/* Mobile Menu Toggle */}
      <div className="md:hidden flex items-center">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-white text-2xl"
        >
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Mobile Sliding Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-[60px] left-0 w-full bg-[#151515] z-50 flex flex-col p-4 space-y-2 md:hidden">
          {menusToShow.map((menu, index) => {
            if (menu.items) {
              return (
                <div key={index} className="flex flex-col">
                  <span className="text-white font-bold">{menu.title}</span>
                  <div className="flex flex-col ml-4 mt-1 space-y-1">
                    {menu.items.map((item) => (
                      <Link
                        key={item.name}
                        to={item.path}
                        className="text-white hover:text-purple-400 transition"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={index}
                to={menu.path}
                className="text-white font-bold hover:text-purple-400 transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                {menu.title}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
};

export default NavLinks;
