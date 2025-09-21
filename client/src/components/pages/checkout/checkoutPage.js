import React, { useEffect, useState } from "react";
import { CgSpinner } from "react-icons/cg";
import "./checkout.css";
import { toast } from "react-toastify";
import { auth } from "../../../firebase";
import withAuth from "../../ProtectionHOCs/withAuth";
import "../on-board.css"
const CheckoutPage = () => {
  const [packageType, setPackageType] = useState("monthly");
  const [error, setError] = useState("")
  const [coinType, setCoinType] = useState("USDT.BEP20");
  const [duration, setDuration] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const getPaymentUrl = () => {
    setError("");
    setIsLoading(true);
    try {
      auth.currentUser.getIdToken().then(async (token) => {
        const response = await fetch(
          process.env.NODE_ENV === "production" ?
            `https://freedombot.online/payment/create-checkout` : 'http://localhost:8001/payment/create-checkout',
          {
            method: "POST",
            body: JSON.stringify({
              packageType,
              coinType,
              duration
            }),
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        ).then((response) => response.json());

        if (response.checkout_url) {
          window.open(response.checkout_url, "_blank");
        }
      });
    } catch (error) {
      setError(error.message)
      console.error("Error getting payment url", error);
    }
    finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    toast.info("You should first pay to access the bot");
  }, []);


  return (
    <div className="h-full flex justify-center items-center">
      <div className="glass_morphism flex flex-col md:justify-center w-[98%] md:w-[50%] h-[95%] md:h-[90%] my-auto mx-auto gap-y-2 md:gap-y-4 p-3 md:p-4 ">
        <h1 className="text-center font-semibold text-white py-2 md:py-3 text-xl">Checkout Page</h1>
        {error &&
          <p className="text-red-500 font-medium">{error}</p>}
        <div className="flex flex-col px-2 md:px-8 gap-y-2">
          <label className="text-white font-semibold">
            Select Your desired package:
          </label>
          <select className="text-white p-2 outline-none glass_morphism" value={packageType} onChange={(e) => setPackageType(e.target.value)}>
            <option value="monthly" className="text-black" >Monthly - 50 USDT</option>
            <option value="yearly" className="text-black">Yearly - 450 USDT</option>
          </select>
        </div>
        <div className="flex flex-col px-2 md:px-8 gap-y-2">
          <label className="text-white font-semibold">
            Select Your package duration in months:
          </label>
          <select className="text-white p-2 outline-none glass_morphism" value={duration} onChange={(e) => setDuration(e.target.value)}>
            <option value="1" className="text-black"  >1</option>
            <option value="2" className="text-black" >2</option>
            <option value="3" className="text-black" >3</option>
            <option value="4" className="text-black" >4</option>
            <option value="5" className="text-black" >5</option>
            <option value="6" className="text-black" >6</option>
            <option value="7" className="text-black" >7</option>
            <option value="8" className="text-black" >8</option>
            <option value="9" className="text-black" >9</option>
            <option value="10" className="text-black" >10</option>
            <option value="11" className="text-black" >11</option>
            <option value="12" className="text-black" >12</option>
          </select>
        </div>
        <div className="flex flex-col px-2 md:px-8 gap-y-2">
          <label className="text-white font-semibold">
            Currency:
          </label>
          <select className="text-white p-2 outline-none glass_morphism bg-transparent" value={coinType} onChange={(e) => setCoinType(e.target.value)}>
            <option className="text-black" value="USDT.BEP20">USDT.BEP20</option>
            <option className="text-black" value="BTC.BEP20"></option>
          </select>
        </div>

        <button className="bg-white rounded-xl text-major-text-style w-40 mx-auto font-semibold p-3" onClick={getPaymentUrl} disabled={isLoading}>{isLoading ? 'Loading...' : 'Process Payment'}</button>
      </div>
    </div>
  );
};


export default withAuth(CheckoutPage);
