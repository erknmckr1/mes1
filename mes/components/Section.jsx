'use client'
import React from "react";
import LeftSideBtnArea from "./LeftSideBtnArea";
import RightSideBtnArea from "./RightSideBtnArea";
import BreakTable from "./BreakTable";
import JobTable from "./JobTable";
import ProcessArea from "./ProcessTable";
function Section() {
  return (
    <div className="w-screen h-[calc(100vh_-_150px)] bg-black relative text-white ">
      <div className="flex w-full h-full p-3">
        {/* left side Image vs. %20 */}
        <div className="w-[20%] h-full  text-white ">
          <LeftSideBtnArea />
        </div>
        {/* w-%80 */}
        <div className="w-[80%]] w-full h-full">
          {/* 60% h*/}
          <div className="w-full h-[60%] flex ">
            {/* Job table */}
            <div className="w-[80%] h-full ">
              <JobTable/>
            </div>
            <div className="w-[20%] h-full  ">
              <RightSideBtnArea/>
            </div>
          </div>
          {/* 40% h*/}
          <div className="w-full h-[40%] flex p-1">
              {/* left side mola  */}
              <div className="w-1/4 h-[full] bg-white flex">
                {/* table2 */}
                <div className="flex flex-col w-full h-full">
                  <BreakTable/>
                </div>
              </div>
              {/* w-1/2 Process area... */}
              <div className="w-2/4 h-full">
                <ProcessArea/>
              </div>
              <div className="w-1/4 h-full bg-white text-black">
              <div className="flex flex-col w-full h-full">
                  <BreakTable/>
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}

export default Section;
