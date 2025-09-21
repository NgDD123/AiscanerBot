import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../../firebase";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { joinRoom, socket } from "../../config/socketIo";
import { toast } from "react-toastify";
import { Navigate } from "react-router-dom";
import { login } from "../../redux/slice/userSlice"
import { useDispatch } from "react-redux";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const [user, setUser] = useState(null);
  const [userPaymentStatus, setUserPaymentStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const idTokenResult = await currentUser.getIdTokenResult(true);
        setUser({ ...currentUser, hasAccess: idTokenResult?.claims?.hasAccess });
        checkUserPaymentStatus(currentUser.uid);
      }
      else {
        setUser(null); // Clear user on logout
        setUserPaymentStatus({})
      }
      setLoading(false);

    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user?.uid) {
      socket.connect();
      joinRoom(user?.email)

      socket.on("paymentMade", () => {
        toast.success("Payment recorded");
        setTimeout(() => {

          window.location.pathname = "/trade"
        }, 2000)
      })
    }

    socket.on("disconnect", () => {
      socket.disconnect();
    });
    return () => {
      socket.disconnect(); // Disconnect the socket when the component unmounts
    };
  }, [user]);

  const signIn = async (email, password) => {
    try {
      const user = await signInWithEmailAndPassword(auth, email, password);
      dispatch(login(user));

      checkUserPaymentStatus();
    } catch (error) {
      console.error("Failed to sign in", error);
    }
  };

  const checkUserPaymentStatus = () => {
    try {
      if (auth.currentUser) {
        auth.currentUser.getIdToken().then(async (token) => {
          const response = await fetch(
            process.env.NODE_ENV === 'production' ?
              `https://freedombot.online/payment/payment-status` : 'http://localhost:8001/payment/payment-status',
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          ).then((response) => response.json());
          setUserPaymentStatus(response);
        });

      }
      else {
        setUserPaymentStatus(null);
      }
    } catch (error) {
      console.error("Error checking payment status", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, userPaymentStatus, signIn, checkUserPaymentStatus }}
    >
      {children}
    </AuthContext.Provider>
  );
};
