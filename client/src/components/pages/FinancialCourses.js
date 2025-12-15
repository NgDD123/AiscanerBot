import React from "react";
import { motion } from "framer-motion";
import { FaBitcoin, FaChartLine, FaUniversity, FaBuilding } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";

// Fade-in helper
const fadeIn = (delay = 0) => ({
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, delay } },
});

// Updated Course data with detailed summaries and icons
const courses = [
  {
    title: "Cryptocurrency Trading",
    description:
      "Master digital currencies like Bitcoin, Ethereum, and altcoins. Learn technical analysis, wallets, DeFi, smart contracts, and trading strategies to confidently navigate crypto markets.",
    topics: [
      { icon: <FaBitcoin />, text: "Crypto Fundamentals" },
      { icon: <FaBitcoin />, text: "Blockchain & Wallets" },
      { icon: <FaChartLine />, text: "Trading Strategies" },
      { icon: <FaChartLine />, text: "Technical Analysis" },
      { icon: <FaBitcoin />, text: "DeFi & Smart Contracts" },
      { icon: <FaChartLine />, text: "Risk Management" },
    ],
  },
  {
    title: "Forex Trading",
    description:
      "Unlock the secrets of global currency trading. Learn chart patterns, technical indicators, leverage, and automated systems to trade Forex like a professional.",
    topics: [
      { icon: <FaChartLine />, text: "Forex Basics" },
      { icon: <FaChartLine />, text: "Currency Pairs & Spreads" },
      { icon: <FaChartLine />, text: "Chart Patterns & Trends" },
      { icon: <FaChartLine />, text: "Technical Indicators" },
      { icon: <FaChartLine />, text: "Automated Trading" },
      { icon: <FaChartLine />, text: "Risk & Money Management" },
    ],
  },
  {
    title: "Stock Market Investing",
    description:
      "Invest like a pro! Learn company analysis, portfolio building, ETFs, dividends, and both long-term and short-term strategies for sustainable wealth creation.",
    topics: [
      { icon: <FaUniversity />, text: "Stock Fundamentals" },
      { icon: <FaUniversity />, text: "Company Analysis" },
      { icon: <FaUniversity />, text: "Financial Statements" },
      { icon: <FaChartLine />, text: "Technical Analysis" },
      { icon: <FaUniversity />, text: "Portfolio Management" },
      { icon: <FaUniversity />, text: "Long-term vs Short-term Investing" },
    ],
  },
  {
    title: "Capital Markets & Companies",
    description:
      "Understand how companies raise capital, IPOs, bonds, and corporate strategies. Learn equity vs debt, market dynamics, valuation methods, and regulations to make informed financial decisions.",
    topics: [
      { icon: <FaBuilding />, text: "Capital Market Basics" },
      { icon: <FaBuilding />, text: "Equity & Debt Financing" },
      { icon: <FaBuilding />, text: "IPO Analysis" },
      { icon: <FaBuilding />, text: "Bond Markets" },
      { icon: <FaBuilding />, text: "Regulations & Compliance" },
      { icon: <FaBuilding />, text: "Corporate Financial Strategy" },
    ],
  },
];

const FinancialCourses = () => {
  const navigate = useNavigate();
  const auth = getAuth();

  const handleEnroll = () => {
    if (!auth.currentUser) {
      navigate("/signup");
      return;
    }
    navigate("/course");
  };

  const goMyCourses = () => {
    navigate("/my-courses");
  };

  const goTeachCourses = () => {
    navigate("/teach-courses");
  };

  return (
    <div className="w-full text-white bg-gray-900 overflow-hidden relative">

      {/* HERO SECTION */}
      <section className="relative w-full h-[70vh] flex flex-col justify-center items-center text-center bg-gradient-to-b from-gray-900 via-gray-800 to-black px-6 overflow-hidden z-10">

        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="text-5xl md:text-6xl font-extrabold text-purple-400 mb-4 tracking-wide"
        >
          Financial Mastery Courses
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="max-w-3xl text-gray-300 text-lg md:text-xl"
        >
          Learn cryptocurrency, forex, stock market, companies, and capital markets with professional guidance, practical exercises, and AI-powered tools.
        </motion.p>

        {/* 🔥 NAVIGATION BUTTONS */}
        <div className="flex flex-wrap gap-4 mt-8 justify-center">
          <button
            onClick={handleEnroll}
            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold"
          >
            Enroll Now
          </button>

          <button
            onClick={goMyCourses}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold"
          >
            My Courses
          </button>

          <button
            onClick={goTeachCourses}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 rounded-xl font-bold"
          >
            Teach Courses
          </button>
        </div>
      </section>

      {/* COURSES SECTION */}
      <section className="py-20 px-6 max-w-7xl mx-auto relative z-10">
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeIn()}
          className="text-4xl font-bold text-purple-300 mb-12 text-center tracking-wide"
        >
          Explore Our Courses
        </motion.h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          {courses.map((course, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 80, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-gray-800 rounded-2xl shadow-lg border border-gray-700"
            >
              <h3 className="text-2xl font-bold text-purple-400 mb-2">
                {course.title}
              </h3>

              <p className="text-gray-300 mb-4">{course.description}</p>

              <ul className="space-y-2 mb-4">
                {course.topics.map((topic, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-400">
                    <span className="text-purple-400">{topic.icon}</span>
                    {topic.text}
                  </li>
                ))}
              </ul>

              {/* 🔥 CARD BUTTONS */}
              <div className="flex gap-3">
                <button
                  onClick={handleEnroll}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold"
                >
                  Enroll
                </button>

                <button
                  onClick={() => navigate("/course")}
                  className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold"
                >
                  View
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default FinancialCourses;
