import React, { useState } from "react";
import FaqCard from "./FaqCard";
import { faqData } from "../../utils/faq";

const Faq = () => {
  const [shownIndex, setShownIndex] = useState(null);

  const handleShow = (index) => {
    setShownIndex(shownIndex === index ? null : index);
  };

  return (
    <div className="flex flex-col gap-2 px-4">
      <div className="w-full flex text-center p-3 flex-col gap-3 justify-center items-center bg-cover box-border md:h-[20vh] h-[16vh] ">
        <h1 className="text-xl md:text-2xl font-sans dark:text-white font-semibold antialiased text-center animate-fade-in">
          Frequently Asked Questions
        </h1>
      </div>
      <div className="grid grid-cols-1 w-full max-w-4xl mx-auto gap-4">
        {faqData.map((faq, index) => (
          <FaqCard
            key={index}
            index={index}
            number={faq.number}
            question={faq.question}
            answer={faq.answer}
            isShown={shownIndex === index}
            onClick={handleShow}
          />
        ))}
      </div>
    </div>
  );
};

export default Faq;
