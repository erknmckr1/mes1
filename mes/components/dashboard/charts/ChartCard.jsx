import React from "react";
import { setActiveView } from "@/redux/dashboardSlice";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
const ChartCard = ({ title, children,headerRight }) => {
const dispatch = useDispatch();
const {activeView} = useSelector(state => state.dashboard);
  return (
    <div className="bg-[#1f2937] p-4 rounded-xl shadow-md border border-gray-700 h-[350px]">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {headerRight && <div>{headerRight}</div>}
      </div>
      <div className="h-full flex justify-center items-center">{children}</div>
    </div>
  );
};

export default ChartCard;
