import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../pages/AuthContext";
import Login from "../pages/Login";
import { toast } from "react-toastify";
import Home from "../pages/home/Home";

const withAuth = (WrappedComponent) => {
  return (props) => {
    const { user, checkUserPaymentStatus, userPaymentStatus } = useAuth();
    const location = useLocation();
    const [isUserLoaded, setIsUserLoaded] = useState(false);
    const [isPaymentStatusLoaded, setIsPaymentStatusLoaded] = useState(false);
    const [isUserLoggedOut, setIsUserLoggedOut] = useState(false);

    useEffect(() => {
      setIsUserLoaded(true);
    }, [user]);

    useEffect(() => {
      if (isUserLoaded) {
        checkUserPaymentStatus();
      }
    }, [isUserLoaded]);

    useEffect(() => {
      if (userPaymentStatus) {
        setIsPaymentStatusLoaded(true);
      }
    }, [userPaymentStatus]);

    if (!isUserLoaded) {
      // Loading user information
      return <div>Loading user...</div>;
    }
    if (isUserLoaded && location.pathname === "/admin") {
      if (user?.email === "ngiriyezadavid2@gmail.com") {
        return <WrappedComponent />;
      }
    }
    if (!isPaymentStatusLoaded && !isUserLoggedOut) {
      // Loading payment status
      return <div className="text-white">Loading payment status...</div>;
    }
    if (isUserLoggedOut) {
      return <Navigate to={"/login"} />;
    }

    if (
      (user && !userPaymentStatus?.needsToPay) ||
      (user && user?.hasAccess && Object.keys(userPaymentStatus).length > 0)
    ) {
      // If the user is authenticated and has paid, render the wrapped component
      return <WrappedComponent {...props} />;
    } else if (user && userPaymentStatus?.needsToPay) {
      if (location.pathname === "/checkout") {
        return <WrappedComponent {...props} />;
      } else {
        return <Navigate to="/checkout" />;
      }
    } else {
      // If the user is not authenticated, redirect to login
      return <Navigate to={"/login"} />;
    }
  };
};

export default withAuth;
