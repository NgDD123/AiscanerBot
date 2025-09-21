import React, { useState } from 'react';
import './login.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from './AuthContext';
import './on-board.css'
import { IoEye } from 'react-icons/io5';
import { FaEyeSlash } from 'react-icons/fa';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const handleShowPassword = () => setShowPassword((prev) => !prev);



  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setIsError(true);
      return
    }
    setIsLoading(true); 5

    try {
      await signIn(email, password);
      const from = location.state?.from?.pathname || '/';
      navigate(from);
    } catch (error) {
      alert(error.message);
    }
    finally {
      setIsLoading(false)
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const user = await createUserWithEmailAndPassword(auth, email, password);
      if (user) {
        navigate('/checkout', { state: { userId: user.user.uid } });
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="w-full h-[70vh] mt-8 ">
      <div className="w-[95%] md:w-[50%] xl:w-[40%] 2xl:w-[35%] mx-auto border-2 border-white p-8 rounded glass_morphism shadow-md flex flex-col ">
        <p className="text-white flex justify-center  font-semibold">Sign-In</p>
        <div className='flex flex-col gap-y-4'>
          {isError && (
            <p className='text-center text-red-500 text-[20px]'>Please fill all required fields!</p>
          )}
          <div className="flex flex-col gap-y-1">
            <p className="text-white text-sm font-normal text-start">Email</p>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="text-white border border-white p-1 px-4 outline-none bg-transparent rounded-md placeholder:text-white text-sm" type="email" placeholder="johndoe@gmail.com" />
          </div>
          <div className="flex flex-col gap-y-1">
            <p className="text-white text-sm font-normal text-start">Password</p>
            <div className="flex w-full items-center justify-between border p-1 pr-3  border-white rounded-md">
              <input value={password} onChange={(e) => setPassword(e.target.value)} className="text-white  px-4 outline-none bg-transparent rounded-md placeholder:text-white text-sm w-[95%]" type={showPassword ? 'text' : 'password'} placeholder="*******" />
              {showPassword ? <IoEye onClick={handleShowPassword} className="text-white text-md" /> : <FaEyeSlash onClick={handleShowPassword} className="text-white text-md" />}

            </div>
          </div>
          <p className="text-white text-sm font-semibold text-start pt-4">Don&apos;t Have an account ? <span><Link className="text-[#ca217ebb] font-semibold" to="/signup" >Sign Up</Link></span></p>

          <button disabled={isLoading} onClick={handleSignIn} type="submit" className="text-[#ca217ebb] border  rounded-2xl bg-white w-1/3 mx-auto p-2 text-sm font-bold hover:cursor-pointer hover:bg-[#ca217ebb] hover:text-white hover:border-none transition duration-300">{isLoading ? 'Loading...' : 'Sign In'}</button>
          <div className='flex items-center mt-6 gap-x-1'>
            <input type='checkbox' className=' outline-none' />
            <p className='text-xs font-light text-white'>By signing in, you agree to the terms and conditions for freedmobot.</p>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
