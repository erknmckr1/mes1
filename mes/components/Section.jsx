"use client";
import React from "react";
import LeftSideBtnArea from "./LeftSideBtnArea";
import RightSideBtnArea from "./RightSideBtnArea";
import BreakTable from "./BreakTable";
import JobTable from "./JobTable";
import ProcessArea from "./ProcessTable";
import Date from "./ui/Date";
import { useSelector } from "react-redux";
function Section() {
  const { theme } = useSelector(theme => theme.global)
  return (
    <div className={`w-screen h-[calc(100vh_-_150px)] relative section ${theme} transition-all`}>
      <div className="flex w-full h-full p-3">
        {/* left side Image vs. %20 */}
        <div className="w-[20%] h-full ">
          <LeftSideBtnArea />
        </div>
        {/* w-%80 */}
        <div className="w-[80%] h-full">
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
              <div className="w-1/2 h-full p-1 ">
                  <BreakTable />
              </div>
              {/* w-1/2 Process area... */}
              <div className="w-1/2 h-full p-1">
                <ProcessArea />
              </div>
            </div>
            {/* 20% saat tarıh  alanı  */}
            <div className="w-[20%] h-full ">
              <Date addProps={"text-[80px]"} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Section;
