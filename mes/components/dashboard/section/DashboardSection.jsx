"use client";
import React from "react";
import Bar from "../charts/BarChart";
import Pie from "../charts/Pie";
import FilterPanel from "../uı/FilterPanel";
import ChartCard from "../charts/ChartCard";
import InsightPanel from "../uı/InsightPanel";
import { useDispatch, useSelector } from "react-redux";
import ChatBox from "../chatbox/ChatBox";
function DashboardSection() {
  return (
    <div className="w-full h-full">
      <ChatBox />
      <div className="w-full h-full flex justify-between items-center">
        {/* chart area */}
        <div className="w-2/3 h-full grid grid-cols-2 gap-4">
          <div className="">
            <Bar />
          </div>
          <ChartCard title="Bölüm Dağılımı">
            <Pie />
          </ChartCard>
          <div className="">
            <Bar />
          </div>
          <div className="">
            <Bar />
          </div>
        </div>
        <div className="w-1/3 h-full">
          <FilterPanel />
          <InsightPanel />
        </div>
      </div>
    </div>
  );
}

export default DashboardSection;
