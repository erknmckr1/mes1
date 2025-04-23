"use client";
import React from "react";
import LeftSideBtnArea from "./LeftSideBtnArea";
import RightSideBtnArea from "./RightSideBtnArea";
import BreakTable from "./BreakTable";
import JobTable from "./JobTable";
import ProcessArea from "./ProcessTable";
import Date from "./ui/Date";
import GroupArea from "./GroupArea";
import { useSelector } from "react-redux";
import { usePathname } from "next/navigation";
function Section() {
  const pathName = usePathname();
  const areaName = pathName.split("/")[3];
  const { theme } = useSelector((theme) => theme.global);
  return (
    <div
      className={`w-screen h-[calc(100vh_-_150px)] relative section ${theme} transition-all`}
    >
      <div className="flex w-full h-full lg:p-3">
        {/* left side Image vs. %20 */}
        <div className="w-[15%] h-full ">
          <LeftSideBtnArea />
        </div>
        {/* w-%80 */}
        <div className="w-[85%] h-full">
          {/* 60% h*/}
          <div className="w-full h-[60%] flex ">
            {/* Job table */}
            <div className="w-[80%] h-full ">
              <JobTable />
            </div>
            <div className="w-[20%] h-full flex items-center justify-center  ">
              <RightSideBtnArea />
            </div>
          </div>
          {/* 40% h break process vs. area */}
          <div className="w-full h-[40%] flex">
            <div className=" w-[80%] h-full  flex justify-between ">
              {/* left side mola area w-1/2  */}
              {areaName !== "cila" &&  <div className="w-1/2 h-full p-1">
                {areaName === "kalite" || areaName ==="buzlama" || areaName === "kurutiras"   || areaName === "cila" ?  (
                  <BreakTable />
                ) : (
                  <div className="w-full h-full flex">
                    <div className="w-1/2 h-full">
                      <GroupArea />
                    </div>
                    <div className="w-1/2 h-full overflow-x-auto">
                      <BreakTable />
                    </div>
                  </div>
                )}
              </div>}
              {/* w-1/2 Process area... */}
              <div className={`${areaName === "cila" ? "w-full h-full p-1" : "w-1/2 h-full p-1"}`}>
                <ProcessArea />
              </div>
            </div>
            {/* 20% saat tarıh  alanı  */}
            <div className="w-[20%] h-full ">
              <Date addProps={"lg:text-[80px]"} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Section;
