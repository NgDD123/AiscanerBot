import { useState } from "react";
import { FaEyeSlash } from "react-icons/fa";
import { IoEye } from "react-icons/io5";
import "../Navbar/navbar.css"
import botImage from "../../assets/freedom ui2-01.png"
import { Link } from "react-router-dom";
import './on-board.css'
import axios from "axios";
import { isValidWalletAddress } from "../../utils/funct.utils";

const OnBoardSignUp = () => {
    const [email, setEmail] = useState("");
    const [walletAddress, setWalletAddress] = useState("");
    const [referalCode, setReferallCode] = useState("");
    const [password, setPassword] = useState("");
    const [confPassword, setConfPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState(false);
    const [apiError, setApiError] = useState("");
    const [accountType, setAccountType] = useState("Individual");
    const [isValidAddress, setIsValidAddress] = useState(false);

    const [confPasswordError, setConfPasswordError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);

    const handleValidateAddress = () => {
        const response = isValidWalletAddress(walletAddress);
        if (response == false) {
            setIsValidAddress(false);
            console.log("operation failed")
        }
        else {
            setIsValidAddress(true);
            console.log("operation succeded")
        }





    }

    const handleCreateAccountAsReferal = () => {
        setAccountType("Referal")
    }
    const handleCreateAsIndividual = () => {
        setAccountType("Individual");
    }


    const handleShowPassword = () => setShowPassword((prev) => !prev);
    const handleShowConfirmPassword = () => setShowConfirmPassword((prev) => !prev);

    const handleRegisterUser = async (e) => {
        e.preventDefault();
        setApiError("");
        setError(false);
        setConfPasswordError(false);
        if (!email.trim() || !password.trim() || !confPassword.trim()) {
            setError(true);
            return;
        }
        if (password !== confPassword) {
            setConfPasswordError(true);
            return;
        }
        setIsLoading(true);
        try {
            const response = await axios.post(
                process.env.NODE_ENV == 'production'
                    ? "https://freedombot.online/user/create-new-user"
                    : "http://localhost:8001/user/create-new-user",
                { email, password, referrer: referalCode, walletAddress }
            );
            const createdUser = response.data;
            setIsRegistered(true);
            return createdUser;
        }
        catch (error) {
            console.log(error);
            setApiError(error.message)
        }
        finally {
            setIsLoading(false);
        }
    }

    if (isRegistered) {
        return (
            <div className="bg-transparent w-full mt-8">
                <div className="w-[95%] md:w-[50%] xl:w-[40%] 2xl:w-[35%] mx-auto border-2 border-white p-8 rounded glass_morphism shadow-md flex flex-col gap-y-6">
                    <div className="text-center text-white">
                        <h2 className="text-2xl font-semibold mb-4">Verify Your Email</h2>
                        <p className="mb-2">Thank you for signing up!</p>
                        <p className="mb-4">We've sent a verification link to:</p>
                        <p className="font-semibold mb-6">{email}</p>
                        <p className="text-sm">Please check your email and click the verification link to activate your account.</p>
                        <p className="text-sm mt-4">Didn't receive the email? Check your spam folder.</p>
                        <Link to="/login" className="text-[#ca217ebb] hover:text-white mt-6 inline-block">
                            Return to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-transparent w-full mt-8">
            <div className="w-[95%] md:w-[50%] xl:w-[40%] 2xl:w-[35%] mx-auto border-2 border-white p-8 rounded glass_morphism shadow-md flex flex-col gap-y-3 ">
                <p className="text-white flex justify-center  font-semibold">Create Account</p>
                <div className="w-full flex items-center justify-between gap-x-4">
                    <button onClick={handleCreateAccountAsReferal} className={`p-2 py-1 text-center rounded-md basis-1/2 font-medium ${accountType == 'Referal' ? 'bg-green-500 text-white' : 'bg-white/20 text-green-500'}`}>Sign Up By Referal</button>
                    <button onClick={handleCreateAsIndividual} className={`p-2 py-1  text-center rounded-md basis-1/2 font-medium ${accountType == 'Individual' ? 'text-white bg-green-500' : 'bg-white/20 text-green-500'}`}>Sign Up Individually</button>
                </div>

                <div className="flex flex-col gap-y-3">
                    {error && <p className="text-sm text-red-500 font-medium">Please fill all required fields</p>}
                    {apiError && <p className="text-sm text-red-500 font-medium">{apiError}</p>}
                    <div className="flex flex-col gap-y-1">
                        <p className="text-white text-sm font-normal text-start">Email</p>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="text-white border border-white p-1 px-4 outline-none bg-transparent rounded-md placeholder:text-gray-500 text-sm"
                            type="email"
                            placeholder="johndoe@gmail.com"
                        />
                    </div>
                    <div className="flex flex-col gap-y-1">
                        <p className="text-white text-sm font-normal text-start">Wallet Address {"(BEP 20)"}</p>
                        <input
                            onBlur={handleValidateAddress}
                            value={walletAddress}
                            onChange={(e) => setWalletAddress(e.target.value)}
                            className="text-white border border-white p-1 px-4 outline-none bg-transparent rounded-md placeholder:text-gray-500 text-sm"
                            type="text"
                            placeholder="TWd4WrZ9wj3ryv9qd9b4AdgntQJQRVHdr7"
                        />

       
                    </div>
                    {
                        accountType == "Referal" && (

                            <div className="flex flex-col gap-y-1">
                                <p className="text-white text-sm font-normal text-start">Referral Code</p>
                                <input
                                    value={referalCode}
                                    onChange={(e) => setReferallCode(e.target.value)}
                                    className="text-white border border-white p-1 px-4 outline-none bg-transparent rounded-md placeholder:text-gray-500 text-sm"
                                    type="text"
                                    placeholder="OXG-RYT"
                                />
                            </div>
                        )
                    }
                    <div className="flex flex-col gap-y-1">
                        <p className="text-white text-sm font-normal text-start">Password</p>
                        <div className="flex w-full items-center justify-between border p-1 pr-3  border-white rounded-md">
                            <input
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="text-white  px-4 outline-none bg-transparent rounded-md placeholder:text-gray-500 text-sm w-[95%]"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="*******"
                            />
                            {showPassword ?
                                <IoEye onClick={handleShowPassword} className="text-white text-md" /> :
                                <FaEyeSlash onClick={handleShowPassword} className="text-white text-md" />
                            }
                        </div>
                    </div>
                    <div className="flex flex-col gap-y-1">
                        <p className="text-white text-sm font-normal text-start">Confirm Password</p>
                        <div className="flex w-full items-center justify-between border  p-1 pr-3  border-white rounded-md">
                            <input
                                value={confPassword}
                                onChange={(e) => setConfPassword(e.target.value)}
                                className="text-white   px-4 outline-none bg-transparent  placeholder:text-gray-500 text-sm w-[95%]"
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="*******"
                            />
                            {showConfirmPassword ?
                                <IoEye onClick={handleShowConfirmPassword} className="text-white text-md" /> :
                                <FaEyeSlash onClick={handleShowConfirmPassword} className="text-white text-md" />
                            }
                        </div>
                        {confPasswordError && <p className="text-sm text-red-500 font-medium">Password must match!</p>}
                    </div>

                    <p className="text-white text-sm font-semibold text-start pt-4">
                        Already Have an account? <span><Link className="text-[#ca217ebb] font-semibold" to="/login">Log In</Link></span>
                    </p>
                </div>
                <button
                
                    onClick={handleRegisterUser}
                    className="text-[#ca217ebb] border border-white/20 rounded-2xl bg-white/20 w-1/3 mx-auto p-2 text-sm font-bold hover:cursor-pointer hover:bg-[#ca217ebb] hover:text-white/20 hover:border-none transition duration-300"
                >
                    {isLoading ? 'Loading ...' : 'Sign Up'}
                </button>
            </div>
        </div>
    )
}

export default OnBoardSignUp;