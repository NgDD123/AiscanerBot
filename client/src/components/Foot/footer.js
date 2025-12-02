import React, { useState } from "react";
import { Link } from "react-router-dom";

import {
  FaChevronDown,
  FaBoxOpen,
  FaBuilding,
  FaBalanceScale,
  FaTelegramPlane,
  FaWhatsapp,
  FaGlobe,
  FaGithub
} from "react-icons/fa";

const Footer = () => {
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <footer className="w-full bg-black text-gray-300 pt-2">

      {/* GLOW BORDER */}
      <div className="w-full h-1 bg-purple-600 shadow-[0_0_20px_4px_rgba(168,85,247,0.7)]"></div>

      <div className="px-6 md:px-16 py-12 border-t border-gray-800">

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-8">

          {/* LOGO SECTION */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-purple-500">🔮</span> Freedom Bot
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              AI-powered trading assistant for maximizing profits in cryptocurrency
              and stock markets.
            </p>
          </div>

          {/* PRODUCT SECTION */}
          <div className="relative md:border-l md:border-gray-800 md:pl-6">
            {/* MOBILE HEADER */}
            <div
              className="md:hidden flex justify-between items-center cursor-pointer py-2"
              onClick={() => toggleSection("product")}
            >
              <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                <FaBoxOpen className="text-purple-400" /> Product
              </h3>
              <FaChevronDown
                className={`text-purple-400 transition-transform duration-300 ${openSection === "product" ? "rotate-180" : ""
                  }`}
              />
            </div>

            {/* DESKTOP OR OPEN CONTENT */}
            <div
              className={`transition-all overflow-hidden duration-300 ease-in-out 
                ${openSection === "product" ? "max-h-60" : "max-h-0 md:max-h-full"} 
                ${openSection === "product" ? "mt-3" : "mt-0 md:mt-3"}`}
            >
              <h3 className="hidden md:flex items-center gap-2 text-white font-semibold text-lg mb-4">
                <FaBoxOpen className="text-purple-400" /> Product
              </h3>

              <div className="flex flex-col space-y-2">
                <Link className="block text-gray-300 hover:text-purple-400 transition duration-200 relative w-fit">
                  Features
                  <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-purple-500 transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <Link className="block text-gray-300 hover:text-purple-400 transition duration-200 relative w-fit">
                  Pricing
                </Link>
                <Link className="block text-gray-300 hover:text-purple-400 transition duration-200 relative w-fit">
                  Testimonials
                </Link>
                <Link className="block text-gray-300 hover:text-purple-400 transition duration-200 relative w-fit">
                  FAQ
                </Link>
              </div>
            </div>
          </div>

          {/* COMPANY SECTION */}
          <div className="relative md:border-l md:border-gray-800 md:pl-6">
            <div
              className="md:hidden flex justify-between items-center cursor-pointer py-2"
              onClick={() => toggleSection("company")}
            >
              <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                <FaBuilding className="text-purple-400" /> Company
              </h3>
              <FaChevronDown
                className={`text-purple-400 transition-transform duration-300 ${openSection === "company" ? "rotate-180" : ""
                  }`}
              />
            </div>

            <div
              className={`transition-all overflow-hidden duration-300 ease-in-out 
                ${openSection === "company" ? "max-h-60" : "max-h-0 md:max-h-full"} 
                ${openSection === "company" ? "mt-3" : "mt-0 md:mt-3"}`}
            >
              <h3 className="hidden md:flex items-center gap-2 text-white font-semibold text-lg mb-4">
                <FaBuilding className="text-purple-400" /> Company
              </h3>

              <div className="flex flex-col space-y-2">
                <Link className="block text-gray-300 hover:text-purple-400 transition duration-200 relative w-fit">
                  About
                </Link>
                <Link className="block text-gray-300 hover:text-purple-400 transition duration-200 relative w-fit">
                  Blog
                </Link>
                <Link className="block text-gray-300 hover:text-purple-400 transition duration-200 relative w-fit">
                  Careers
                </Link>
                <Link className="block text-gray-300 hover:text-purple-400 transition duration-200 relative w-fit">
                  Contact
                </Link>
              </div>
            </div>
          </div>

          {/* LEGAL SECTION */}
          <div className="relative md:border-l md:border-gray-800 md:pl-6">
            <div
              className="md:hidden flex justify-between items-center cursor-pointer py-2"
              onClick={() => toggleSection("legal")}
            >
              <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                <FaBalanceScale className="text-purple-400" /> Legal
              </h3>
              <FaChevronDown
                className={`text-purple-400 transition-transform duration-300 ${openSection === "legal" ? "rotate-180" : ""
                  }`}
              />
            </div>

            <div
              className={`transition-all overflow-hidden duration-300 ease-in-out 
                ${openSection === "legal" ? "max-h-60" : "max-h-0 md:max-h-full"} 
                ${openSection === "legal" ? "mt-3" : "mt-0 md:mt-3"}`}
            >
              <h3 className="hidden md:flex items-center gap-2 text-white font-semibold text-lg mb-4">
                <FaBalanceScale className="text-purple-400" /> Legal
              </h3>

              <div className="flex flex-col space-y-2">
                <Link className="block text-gray-300 hover:text-purple-400 transition duration-200 relative w-fit">
                  Terms
                </Link>
                <Link className="block text-gray-300 hover:text-purple-400 transition duration-200 relative w-fit">
                  Privacy
                </Link>
                <Link className="block text-gray-300 hover:text-purple-400 transition duration-200 relative w-fit">
                  Cookies
                </Link>
                <Link className="block text-gray-300 hover:text-purple-400 transition duration-200 relative w-fit">
                  Licenses
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM AREA */}
        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Freedom Trading Bot. All rights reserved.
          </p>

          <div className="flex gap-6 mt-4 md:mt-0 text-xl">
            <a href="https://t.me/FreedomScanner" target="_blank" rel="noreferrer" className="hover:text-purple-400 transition duration-200 cursor-pointer">
              <FaTelegramPlane />
            </a>

            <a href="https://wa.me/250787703659" target="_blank" rel="noreferrer" className="hover:text-purple-400 transition duration-200 cursor-pointer">
              <FaWhatsapp />
            </a>

            <a href="https://freedomscanner.com" target="_blank" rel="noreferrer" className="hover:text-purple-400 transition duration-200 cursor-pointer">
              <FaGlobe />
            </a>

            <a href="https://github.com/" target="_blank" rel="noreferrer" className="hover:text-purple-400 transition duration-200 cursor-pointer">
              <FaGithub />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
