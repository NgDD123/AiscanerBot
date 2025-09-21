import { Plus, X } from "lucide-react";
import React from "react";
import "../../pages/on-board.css"



const FaqCard= ({ index, number, question, answer, isShown, onClick }) => {
    return (
      <div className={`flex dark:border-[#262626] dark:border shadow-sm p-3 flex-row items-start md:items-center justify-between gap-2 cursor-pointer border-l-4 ${isShown ? "border-[#007AFF] dark:border-[#6DB3FF] glass_morphism" : "glass_morphism"}`}
        onClick={() => onClick(index)}>
        <div className={`flex flex-row gap-2 ${isShown ? "items-start" : "items-center"} transition-all duration-300 ease-in-out`}>
          <div className={`py-2 px-3 font-medium text-base rounded-md bg-minor-text-style  border-gray-400 ${isShown ? "text-[#007AFF] dark:text-[#6DB3FF]" : "dark:text-white"}`}>
            {number}
          </div>
          <div className="flex flex-col gap-1">
            <h1 className={`font-medium antialiased md:text-base text-sm ${isShown ? "text-[#007AFF] dark:text-[#6DB3FF]" : "dark:text-white"}`}>
              {question}
            </h1>
            <p className={`${isShown ? "block" : "hidden"} md:text-xs text-[10px] text-[#8A8A8E] w-full md:w-[80%] dark:text-[#E6E6E6] font-light transition-all duration-500 ease-in-out`}>
              {answer}
            </p>
          </div>
        </div>
        <div className={`transform transition-transform duration-300 ${isShown ? "rotate-90" : ""}`}>
          {isShown ? (
            <X size={18} className={`text-[#007AFF] dark:text-[#6DB3FF]`} />
          ) : (
            <Plus size={18} className="dark:text-white" />
          )}
        </div>
      </div>
    );
  };

export default FaqCard;