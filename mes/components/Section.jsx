'use client'
import React from "react";
import LeftSideBtnArea from "./LeftSideBtnArea";
import RightSideBtnArea from "./RightSideBtnArea";
import BreakTable from "./uı/breakTable";

function Section() {
  return (
    <div className="w-screen h-[calc(100vh_-_150px)] bg-black relative text-white ">
      <div className="flex w-full h-full">
        {/* left side Image vs. %20 */}
        <div className="w-[20%] h-full  text-white p-3 border-secondary border-2">
          <LeftSideBtnArea />
        </div>
        {/* w-%80 */}
        <div className="w-[80%]] w-full h-full">
          {/* 60% h*/}
          <div className="w-full h-[60%] flex ">
            {/* Job table */}
            <div className="w-[80%] h-full text-white overflow-y-scroll">

            </div>
            <div className="w-[20%] h-full  border-secondary border-l-2">
              <RightSideBtnArea/>
            </div>
          </div>
          {/* 40% h*/}
          <div className="w-full h-[40%] flex p-1">
              {/* left side mola  */}
              <div className="w-1/2 h-[full] bg-white flex">
                {/* table2 */}
                <div className="flex flex-col w-full h-full">
                  <BreakTable/>
                </div>
              </div>
              {/* w-1/2 */}
              <div className="w-1/2 h-full">
                
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}

export default Section;
