import { Input, InputWrapper } from "@mantine/core";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { DataTable } from "../../Table";

const ProfilePage = () => {
  const userInfo = useSelector((state) => state?.user?.user?.user);
  const [user, setUser] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(
          process.env.NODE_ENV === "production"
            ? `https://freedombot.online/user/${userInfo.uid}`
            : `http://localhost:8001/user/${userInfo.uid}`,
        );
        setUser(res.data.user);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchUserReferrals = async () => {
      if (user?.referralCode) {
        try {
          setIsLoading(true);
          const res = await axios.get(
            process.env.NODE_ENV === "production"
              ? `https://freedombot.online/user/referrals/${user.referralCode}`
              : `http://localhost:8001/user/referrals/${user.referralCode}`,
          );
          setReferrals(res.data.referrals);
        } catch (error) {
          console.error("Error fetching referrals:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchUserReferrals();
  }, [user]);

  const columns = [
    { accessorKey: "email", header: "Email" },
    { accessorKey: "referralCode", header: "Referral Code" },
    { accessorKey: "walletAddress", header: "Wallet Address" },
  ];

  return (
    <div className="bg-gray-900 text-white min-h-screen p-6">
      <div className="flex flex-col md:flex-wrap gap-6 justify-center items-stretch">
        {/* Profile Section */}
        <div className="flex-[1_1_50%] bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex flex-col items-center">
            <img
              src={`https://ui-avatars.com/api/?name=${userInfo?.email}&bold=true`}
              alt="Profile"
              className="w-24 h-24 rounded-full shadow-md mb-4"
            />
            <div className="w-full grid gap-4 sm:grid-cols-2">
              <InputWrapper description="Email Address">
                <Input value={userInfo?.email} disabled />
              </InputWrapper>
              <InputWrapper description="Email Verified">
                <Input
                  value={userInfo?.emailVerified ? "Verified" : "Not Verified"}
                  disabled
                />
              </InputWrapper>
              <InputWrapper description="Wallet Address">
                <Input value={user?.walletAddress} disabled />
              </InputWrapper>
              <InputWrapper description="Referral Code">
                <Input value={user?.referralCode} disabled />
              </InputWrapper>
            </div>
          </div>
        </div>

        {/* Referrals Section */}
        <div className="flex-[1_1_50%] bg-gray-800 rounded-lg shadow-lg p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-lg font-semibold">Loading...</p>
            </div>
          ) : referrals.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-lg font-semibold">No Referrals Found</p>
            </div>
          ) : (
            <div className="flex flex-col">
              <h2 className="text-2xl font-semibold text-center mb-4">
                Referrals
              </h2>
              <DataTable
                columns={columns}
                data={referrals}
                className="bg-gray-700 rounded-lg shadow-lg overflow-hidden"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
