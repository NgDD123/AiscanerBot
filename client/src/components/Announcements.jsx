import SorryGif from "@/assets/sorry.svg";
import React, { useState } from "react";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
const responsive = {
  mobile: {
    breakpoint: { max: 50000, min: 0 },
    items: 1,
  },
};

const Announcements = () => {
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState();
  const [err, setErr] = useState();
  return (
    <div className=" bg-[#EAEAED] rounded-md p-4">
      <p className="text-sm mb-5 ">Announcements</p>
      <div className="flex flex-col h-[400px]   items-center justify-center gap-4 ">
        <Image src={SorryGif} alt="" className="w-[250px]" />
        <p className="text-sm text-gray-500 text-center ">
          The Announcements feature is under development. Thank you for your
          patience!
        </p>
      </div>
    </div>
  );
};

export default Announcements;
