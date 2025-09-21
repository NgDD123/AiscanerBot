import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./navbar.css";
import { auth } from "../../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

const Navbar = () => {
  const [user, setUser] = useState({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleAuthentication = async () => {
    if (user) {
      signOut(auth);
      setUser(null);
    }
  };

  return (
    <nav className="App w-full z-20 fixed top-0">
      <ul className="w-full flex items-center justify-between p-4 bg-[#220314bb]">
        <div className="flex items-center justify-evenly gap-x-10">
          <li className="text-[#c6c90db9] hover:cursor-pointer font-semibold">
            <Link to="/">Home</Link>
          </li>
          <li className="text-[#c6c90db9] hover:cursor-pointer font-semibold">
            <Link to="/Trade">Trade</Link>
          </li>
          <li className="text-[#c6c90db9] hover:cursor-pointer font-semibold">
            <Link to="/checkout">payment</Link>
          </li>

          <li className="text-[#c6c90db9] hover:cursor-pointer font-semibold">
            <Link to="/contact"></Link>
          </li>
          {(user?.email === "ngiriyezadavid2@gmail.com") && (
            <li className="text-[#c6c90db9] hover:cursor-pointer font-semibold">
              <Link to="/admin">Admin</Link>
            </li>
          )}

        </div>

        <div className="navbar-options">
          <li className="text-[#c6c90db9] hover:cursor-pointer font-bold">
            <Link to={!user ? "/signup" : "/"}>
              <div onClick={handleAuthentication} className="nav-options">
                <span className="nav-optionOne">
                  {!user ? " " : user.email}
                </span>
                <span className="nav-optionTwo">
                  {user ? " Sign Out" : " Sign Up "}
                </span>
              </div>
            </Link>
          </li>
        </div>
      </ul>
    </nav>
  );
};

export default Navbar;

