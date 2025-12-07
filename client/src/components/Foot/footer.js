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
  FaGithub,
} from "react-icons/fa";

const Footer = () => {
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  const footerSections = [
    {
      id: "product",
      title: "Product",
      icon: <FaBoxOpen className="text-purple-400" />,
      links: ["Features", "Pricing", "Testimonials", "FAQ"],
    },
    {
      id: "company",
      title: "Company",
      icon: <FaBuilding className="text-purple-400" />,
      links: ["About", "Blog", "Press", "Careers", "Investors", "Vendors"],
    },
    {
      id: "learn",
      title: "Learn",
      icon: <FaBalanceScale className="text-purple-400" />,
      links: [
        "Market Statistics",
        "Crypto Basics & advenced courses",
        "Tips & Tutorials in trading",
        "Stock Market update & courses",
        "Capital Martet update & courses",
        "investiment and risk management",
        "Crypto Glossary",
        "Market Updates",
        "What is Bitcoin?",
        "What is Blockchain?",
        "How to Set Up a Wallet?",
        "How to Send Crypto?",
      ],
    },
    {
      id: "support",
      title: "Support",
      icon: <FaBalanceScale className="text-purple-400" />,
      links: [
        "Help Center",
        "Contact Us",
        "Create Account",
        "ID Verification",
        "Payment Methods",
        "Account Access",
        "Status",
      ],
    },
    {
      id: "legal",
      title: "Legal",
      icon: <FaBalanceScale className="text-purple-400" />,
      links: [
        "Terms",
        "Privacy",
        "Cookies",
        "Cookie Preferences",
        "Do Not Share My Personal Information",
        "Digital Asset Disclosures",
        "Licenses",
      ],
    },
    {
      id: "individuals",
      title: "Individuals",
      icon: <FaBalanceScale className="text-purple-400" />,
      links: ["Buy & Sell", "Earn Free Crypto", "Trading Bot", "Mobile App"],
    },
    {
      id: "businesses",
      title: "Businesses",
      icon: <FaBalanceScale className="text-purple-400" />,
      links: ["Asset Listings", "Business Services", "Payments", "Commerce"],
    },
    {
      id: "developers",
      title: "Developers",
      icon: <FaBalanceScale className="text-purple-400" />,
      links: [
        "Developer Platform",
        "Server Wallets",
        "Embedded Wallets",
        "Smart Wallets",
        "Trade API",
        "Data API",
      ],
    },
    {
      id: "assetPrices",
      title: "Asset Prices",
      icon: <FaBalanceScale className="text-purple-400" />,
      links: [
        "Bitcoin Price",
        "Ethereum Price",
        "Solana Price",
        "XRP Price",
        "BNB Price",
      ],
    },
  ];

  return (
    <footer className="w-full bg-black text-gray-300 pt-2">
      {/* Top Glow Line */}
      <div className="w-full h-1 bg-purple-600 shadow-[0_0_20px_4px_rgba(168,85,247,0.8)]"></div>

      <div className="px-6 md:px-16 py-12 border-t border-gray-800">

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-10 pb-12">
          
          {/* LOGO */}
          <div className="space-y-3 col-span-1 md:col-span-2">
            <h2 className="text-3xl font-bold text-white flex items-center gap-2">
              <span className="text-purple-500 text-4xl">🔮</span> Freedom Bot
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              AI-powered multi-market trading assistant for cryptocurrency, forex, stocks, and global financial markets.
            </p>
            <p className="text-gray-500 text-sm">
              Smart automation for smart traders.
            </p>
          </div>

          {/* DYNAMIC FOOTER SECTIONS */}
          {footerSections.map((section) => (
            <div key={section.id} className="relative md:border-l md:border-gray-800 md:pl-6">

              {/* MOBILE HEADER */}
              <div
                className="md:hidden flex justify-between items-center cursor-pointer py-2"
                onClick={() => toggleSection(section.id)}
              >
                <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                  {section.icon} {section.title}
                </h3>
                <FaChevronDown
                  className={`text-purple-400 transition-transform duration-300 
                    ${openSection === section.id ? "rotate-180" : ""}`}
                />
              </div>

              {/* CONTENT */}
              <div
                className={`transition-all overflow-hidden duration-300 ease-in-out
                  ${
                    openSection === section.id
                      ? "max-h-96"
                      : "max-h-0 md:max-h-full"
                  }
                  mt-3`}
              >
                <h3 className="hidden md:flex items-center gap-2 text-white font-semibold text-lg mb-4">
                  {section.icon} {section.title}
                </h3>

                <div className="flex flex-col space-y-2">
                  {section.links.map((link, i) => (
                    <Link
                      key={i}
                      className="block text-gray-300 hover:text-purple-400 transition duration-200 relative w-fit"
                    >
                      {link}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* BOTTOM BAR */}
        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Freedom Trading Bot. All rights reserved.
          </p>

          <div className="flex gap-6 mt-4 md:mt-0 text-xl">
            <a className="hover:text-purple-400 transition">
              <FaTelegramPlane />
            </a>
            <a className="hover:text-purple-400 transition">
              <FaWhatsapp />
            </a>
            <a className="hover:text-purple-400 transition">
              <FaGlobe />
            </a>
            <a className="hover:text-purple-400 transition">
              <FaGithub />
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
