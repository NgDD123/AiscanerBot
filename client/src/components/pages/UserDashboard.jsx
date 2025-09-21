import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { BuildingIcon } from '../icons';
import { auth } from '../../firebase';
import { toast } from 'react-toastify';
import axios from 'axios';
import BlogCard from '../card/BlogCard';

function UserDashboard() {
  const [blogs, setBlog] = useState([]);
  const [isFetchingBlogs, setIsFetchingBlogs] = useState(false);

  const getGreeting = () => {
    const currentTime = new Date().getHours();
    return currentTime >= 5 && currentTime < 12
      ? 'Good Morning ☀️'
      : currentTime >= 12 && currentTime < 18
        ? 'Good Afternoon 🌤️'
        : 'Good Evening 🌙';
  };

  const userInfo = useSelector((state) => state?.user?.user?.user);

  useEffect(() => {
    const getAllBlogs = async (token) => {
      setIsFetchingBlogs(true);
      try {
        const { data } = await axios.get(
          process.env.NODE_ENV === "production"
            ? `https://freedombot.online/blogs/all`
            : 'http://localhost:8001/blogs/all',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            }
          }
        );

        if (data.status === true) {
          setBlog(data.data);
        }
      } catch (error) {
        toast.error("Failed to get all blogs");
      } finally {
        setIsFetchingBlogs(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const token = await user.getIdToken();
        getAllBlogs(token);
      }
    });

    // Cleanup the subscription on component unmount
    return () => unsubscribe();

  }, []);

  return (
    <div className='w-full flex flex-col h-full'>
      <p className="text-xs text-white">
        {getGreeting()} <span className="font-semibold">{userInfo ? userInfo.email : ' '},</span>
      </p>
      <p className='text-white text-2xl font-bold'>Welcome to Freedom Bot</p>

      {
        isFetchingBlogs ? (
          <div className="w-full flex justify-center items-center h-full text-white" >
            Loading
          </div>
        ) : (
          <div className='w-full grid grid-cols-1 md:grid-cols-3 gap-4 pt-4'>
            {
              Array.isArray(blogs) && blogs.map((blog, index) => (
                <BlogCard blog={blog.data} key={index} id={blog.id} />
              ))
            }
          </div>
        )
      }
    </div>
  );
}

export default UserDashboard;
