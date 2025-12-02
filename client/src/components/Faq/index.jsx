import React, { useState } from "react";
import FaqCard from "./FaqCard";
import { faqData } from "../../utils/faq";

const Faq = () => {
    const [shownIndex, setShownIndex] = useState(null);

    const handleShow = (index) => {
        setShownIndex(shownIndex === index ? null : index);
    };

    return (
        <div className="relative flex flex-col gap-2 px-4 overflow-hidden bg-[#0c002b]">
            
            {/* Background gradient + glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f29] via-[#0c002b] to-[#2b0048]"></div>
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] opacity-30 blur-[180px] rounded-full bg-[#7900ff]"></div>

            {/* Content wrapper (keeps text above background) */}
            <div className="relative z-10">
                <div className="w-full flex text-center p-3 flex-col gap-3 justify-center items-center box-border md:h-[20vh] h-[16vh]">
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
        </div>
    );
};

export default Faq;
