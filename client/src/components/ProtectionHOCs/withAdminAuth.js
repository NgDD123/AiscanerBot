import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../pages/AuthContext";

const withAdminAuth = (WrappedComponent) => {
    return (props) => {
        const { user, loading } = useAuth();
        const location = useLocation();

        // Display a loading indicator while checking authentication status
        if (loading) {
            return <div>Loading...</div>; // Or replace with a custom loading spinner
        }


        // Check if the user is logged in and is an admin
        if (user && user.email === "ngiriyezadavid2@gmail.com") {
            // If user is admin, render the wrapped component
            return <WrappedComponent {...props} />;
        } else {
            // If user is not admin, redirect to the previous page or a default route
            return <Navigate to={location.state?.from || "/"} replace />;
        }
    };
};

export default withAdminAuth;
