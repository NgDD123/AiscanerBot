import React from "react";
import "./Home.css";

import botImage from "../../../assets/freedom ui2-01.png";
import Faq from "../../Faq";
import ContactSection from "../ContactusForm";

const Home = () => {
  const handleBookDemo = () => {
    window.location.replace("/login");
  };
  return (
    <div className=" flex flex-col min-h-[20rem] w-full  ">
      <div className="flex flex-col gap-y-8 md:gap-y-0 md:flex-row justify-between py-10 px-4">
        <div className="flex flex-col basis-1/2 gap-y-6">
          <p className=" bg-gradient-to-r from-white via-purple-600 to-major-text-style bg-clip-text text-3xl md:text-5xl leading-20 font-bold md:w-[65%] text-transparent">
            Freedom Trading Bot
          </p>
          <div className="md:w-[85%] text-wrap text-lg text-white font-medium">
            Unlock your financial freedom with our Freedom trading bot and move
            to the moon of success, maximizing profits effortlessly while you
            focus on what matters.
          </div>
          <button
            onClick={handleBookDemo}
            className="p-2 rounded-2xl bg-white text-purple-600 w-[90%] mx-auto md:mx-0 md:w-40 font-bold"
          >
            BOOK A DEMO
          </button>
        </div>
        <div className="basis-1/2 flex justify-center">
          <img src={botImage} />
        </div>
      </div>
      <Faq />
      <ContactSection />
    </div>
  );
};

export default Home;
