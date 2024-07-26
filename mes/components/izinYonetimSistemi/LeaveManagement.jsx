"use client";
import React, { useEffect } from "react";
import { useState } from "react";
import UserCard from "./UserCard";
import { useSelector } from "react-redux";
import axios from "axios";
import TabButtons from "./parts/TabButtons";
import { leaveConfig } from "./LeaveConfig";

function LeaveManagement() {
  const [tab, setTab] = useState("1");
  const { selectedFlow } = useSelector((state) => state.global);
  const { id_dec } = useSelector((state) => state.user.userInfo);
  const [authIdRecords, setAuthIdRecords] = useState(null);

  useEffect(() => {
    const handleGetLeaveByAuthId = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/leave/getLeaveRecordsAuthId`,
          {
            params: { id_dec },
          }
        );
        if (response.status === 200) {
          setAuthIdRecords(response.data);
        } else {
          console.log("asdasd");
        }
      } catch (err) {
        console.log(err);
      }
    };

    handleGetLeaveByAuthId();
  }, []);

  const currentFlow = leaveConfig[selectedFlow];
  const currentTab = currentFlow?.tabs[tab];

  return (
    <div className="h-full w-full   flex items-center  gap-x-3 px-4">
      <div className="w-full h-full flex flex-col">
        <div className="w-full h-[95%] flex gap-x-4 justify-center ">
          {/* user info */}
          <UserCard />
          {/* süreç ekranlarındaki sağ taraf */}
          {currentFlow && (
            <div className="bg-[#F5F7F8] h-full  rounded-md shadow-md w-4/5">
              {/* {selectedFlow && selectedFlow === "Tüm İzin Talepleri" && (
                <div className="h-28 bg-[#9CA986]  rounded-md px-5 ">
                  <LeaveRangePicker />
                </div>
              )} */}
              <TabButtons
                tab={tab}
                setTab={setTab}
                selectedFlow={selectedFlow}
              />
              {/* izin talep formu */}
              <div className="w-full h-[450px] mt-1">
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
