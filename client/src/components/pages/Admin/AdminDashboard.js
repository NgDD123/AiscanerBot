import React, { useEffect, useState } from "react";
import { FaEyeSlash, FaRegTrashAlt } from "react-icons/fa";
import axios from "axios";
import { auth } from "../../../firebase";
import "./AdminDashboard.css"; // Import your CSS file for styling
import withAuth from "../../ProtectionHOCs/withAuth";
import { DataTable } from "../../Table";
import "../on-board.css";
import { IoEye } from "react-icons/io5";
import { isValidWalletAddress } from "../../../utils/funct.utils";

function AdminDashboard() {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    walletAddress: "",
    referrer: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const handleShowPassword = () => setShowPassword((prev) => !prev);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isValidAddress, setIsValidAddress] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);
  const handleValidateAddress = () => {
    const response = isValidWalletAddress(newUser.walletAddress);
    console.log("Validation result", response);
    if (response == false) {
      setIsValidAddress(false);
      console.log("operation failed");
    } else {
      setIsValidAddress(true);
      console.log("operation succeded");
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = await auth.currentUser.getIdToken();
      const response = await axios.get(
        process.env.NODE_ENV == "production"
          ? "https://freedombot.online/user"
          : "http://localhost:8001/user",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users: ", error);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (e) => {
    e.preventDefault();
    setError(false);
    if (!newUser.email || !newUser.password) {
      setError(true);
      return;
    }

    setIsLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await axios.post(
        process.env.NODE_ENV == "production"
          ? "https://freedombot.online/user/create-new-user"
          : "http://localhost:8001/user/create-new-user",
        newUser,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const createdUser = response.data.user;
      setUsers((prevUsers) => [...prevUsers, createdUser]); // Add new user to the state array
      setNewUser({ email: "", password: "" }); // Reset new user form
      setIsModalOpen(false); // Close the modal
    } catch (error) {
      console.error("Error creating user: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    const isSure = window.confirm("Are you sure you want to delete this user?");
    if (isSure) {
      try {
        const token = await auth.currentUser.getIdToken();
        await axios.delete(
          process.env.NODE_ENV == "production"
            ? `https://freedombot.online/user/${userId}`
            : `http://localhost:8001/user/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        setUsers((prevUsers) =>
          prevUsers.filter((user) => user.uid !== userId),
        ); // Remove the deleted user from the state array
      } catch (error) {
        console.error("Error deleting user: ", error);
      }
    }
  };

  const giveUserAccess = async (userId) => {
    const isSure = window.confirm(
      "Are you sure you want to give this user access?",
    );
    if (isSure) {
      try {
        const token = await auth.currentUser.getIdToken();
        await axios.put(
          process.env.NODE_ENV === "production"
            ? `https://freedombot.online/user/give-user-access/${userId}`
            : `http://localhost:8001/user/give-user-acces/${userId}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.uid === userId
              ? {
                  ...user,
                  customClaims: { ...user.customClaims, hasAccess: true },
                }
              : user,
          ),
        );
      } catch (error) {
        console.error("Error giving user access: ", error);
      }
    }
  };

  const removeUserAccess = async (userId) => {
    const isSure = window.confirm(
      "Are you sure you want to remove this user access?",
    );
    if (isSure) {
      try {
        const token = await auth.currentUser.getIdToken();
        await axios.put(
          process.env.NODE_ENV === "production"
            ? `https://freedombot.online/user/remove-user-access/${userId}`
            : `http://localhost:8001/user/remove-user-access/${userId}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.uid === userId
              ? {
                  ...user,
                  customClaims: { ...user.customClaims, hasAccess: false },
                }
              : user,
          ),
        );
      } catch (error) {
        console.error("Error deleting user: ", error);
      }
    }
  };

  const columns = [
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="text-start text-white font-semibold">
          {row.getValue("email")}
        </div>
      ),
    },
    {
      accessorKey: "needsToPay",
      header: "Paid",
      cell: ({ row }) => (
        <div className="text-start text-sidebar-text font-semibold text-[11px]">
          {row.getValue("needsToPay") == false ? (
            <button className="text-green-400 rounded glass_morphism text-center w-20 py-1">
              Paid
            </button>
          ) : (
            <button className="text-red-400 rounded glass_morphism text-center w-20 py-1">
              Not Paid
            </button>
          )}
        </div>
      ),
    },

    {
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-x-6">
          <div
            className="flex items-center "
            onClick={() => {
              deleteUser(row.original.uid);
            }}
          >
            <FaRegTrashAlt className="text-red-500 text-xl" />
          </div>

          {row.original?.customClaims?.hasAccess && (
            <div
              className="glass_morphism py-1 flex items-center justify-center w-32 text-red-500"
              onClick={() => removeUserAccess(row.original.uid)}
            >
              Remove access
            </div>
          )}
          {!row.original?.customClaims?.hasAccess && (
            <div
              className="glass_morphism py-1 flex items-center justify-center w-32 text-green-500"
              onClick={() => giveUserAccess(row.original.uid)}
            >
              Give acces
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-y-4">
      <h1 className="text-white">Admin Dashboard</h1>
      <div className={"w-full flex justify-end"}>
        <button
          className="flex gap-x-4 bg-white border-none outline-none rounded-xl text-major-text-style p-3"
          onClick={() => setIsModalOpen(true)}
        >
          Create New User
        </button>
      </div>

      <DataTable loading={loading} columns={columns} data={users} />
      {isModalOpen && (
        <div className="modal">
          <div className="glass_morphism p-4 flex flex-col gap-y-6 w-[90%] md:w-[55%] lg:w-[36%]">
            <p className="text-white flex justify-center  font-semibold">
              Create New User
            </p>

            <div className="flex flex-col gap-y-1">
              {error && (
                <p className="text-sm text-red-500 font-medium text-center">
                  Please fill all required fields
                </p>
              )}

              <p className="text-white text-sm font-normal text-start">Email</p>
              <input
                className="text-white border border-white p-1 px-4 outline-none bg-transparent rounded-md placeholder:text-white text-sm"
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col gap-y-1">
              <p className="text-white text-sm font-normal text-start">
                Wallet Address {"(BEP 20)"}
              </p>
              <input
                onBlur={handleValidateAddress}
                value={newUser.walletAddress}
                onChange={(e) =>
                  setNewUser({ ...newUser, walletAddress: e.target.value })
                }
                className="text-white border border-white p-1 px-4 outline-none bg-transparent rounded-md placeholder:text-gray-500 text-sm"
                type="text"
                placeholder="TWd4WrZ9wj3ryv9qd9b4AdgntQJQRVHdr7"
              />

              {/* {
                            isValidAddress == true ? (
                                <p className="text-green-500" >Valid Address</p>
                            ) : (

                                <p className="text-red-500">Invalid Address!</p>
                            )
                        } */}
            </div>
            <div className="flex flex-col gap-y-1">
              <p className="text-white text-sm font-normal text-start">
                Password
              </p>
              <div className="flex w-full items-center justify-between border p-1 pr-3  border-white rounded-md">
                <input
                  className="text-white  px-4 outline-none bg-transparent rounded-md placeholder:text-white text-sm w-[95%]"
                  type={showPassword ? "text" : "password"}
                  placeholder="*******"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                />
                {showPassword ? (
                  <IoEye
                    onClick={handleShowPassword}
                    className="text-white text-md"
                  />
                ) : (
                  <FaEyeSlash
                    onClick={handleShowPassword}
                    className="text-white text-md"
                  />
                )}
              </div>
            </div>

            <button
              className="rounded-2xl  w-1/3 mx-auto p-2 text-sm font-bold hover:cursor-pointer bg-[#ca217ebb] text-white border-none transition duration-300"
              onClick={createUser}
            >
              {isLoading ? "Loading..." : "Create User"}
            </button>
            <button onClick={() => setIsModalOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(AdminDashboard);
