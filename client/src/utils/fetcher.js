import axios from "axios";

export const api = axios.create({
  baseURL:
    process.env.NODE_ENV === "production"
      ? "https://freedombot.online"
      : "http://localhost:8001",
  headers: {
    "Content-Type": "application/json",
  },
});
export const AuthAPi = axios.create({
  baseURL:
    process.env.NODE_ENV == "production"
      ? "https://freedombot.online"
      : "http://localhost:8001",
  headers: {
    Authorization: `Bearer ${sessionStorage.getItem("token")}`,
  },
});

export const getResError = (error) => {
  if (!error) return "Something Went Wrong";
  const isNetError = error?.message?.includes("Network Error");
  if (isNetError) return "Network Error";
  return (
    error?.response?.data?.error ??
    error?.response?.data?.message ??
    error?.message ??
    "Something Went Wrong"
  );
};
