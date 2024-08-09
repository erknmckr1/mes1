"use client";
import React, { useEffect } from "react";
import { useState } from "react";
import UserCard from "./UserCard";
import { useSelector,useDispatch } from "react-redux";
import { setAllUser } from "@/redux/userSlice";
import TabButtons from "./parts/TabButtons";
import { leaveConfig } from "./LeaveConfig";
import axios from "axios";
import { toast } from "react-toastify";

function LeaveManagement() {
  const [tab, setTab] = useState("1");
  const { selectedFlow } = useSelector((state) => state.global);
  const currentFlow = leaveConfig[selectedFlow];
  const currentTab = currentFlow?.tabs[tab];
  const dispatch = useDispatch();
  useEffect(() => {
    async function getAllUser() {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/getAllUsers`
        );
        if (response.status === 200) {
          dispatch(setAllUser(response.data));
        } else {
          toast.error("Kullanıcı verileri çekilemedi LeaveManagement");
        }
      } catch (err) {
        console.log(err);
      }
    }

    getAllUser();
  }, []);

  return (
    <div className="h-full w-full   flex items-center  sm:gap-x-3 sm:px-4">
      <div className="w-full h-full flex flex-col">
        <div className="w-full h-[100%] sm:h-[95%] flex gap-x-4 justify-center ">
          {/* user info */}
          <UserCard />
          {/* süreç ekranlarındaki sağ taraf */}
          {currentFlow && (
            <div className="bg-[#F5F7F8] h-full  rounded-md shadow-md w-full sm:w-4/5">
              <TabButtons
                tab={tab}
                setTab={setTab}
                selectedFlow={selectedFlow}
              />
              {/* izin talep formu */}
              <div className="w-full h-[550px]  mt-1">
                {currentTab?.component}
              </div>
            </div>
          )}

          {selectedFlow === "" && (
            <div className="bg-[#5F6F65] max-h-full  rounded-md shadow-md w-2/3"></div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LeaveManagement;
