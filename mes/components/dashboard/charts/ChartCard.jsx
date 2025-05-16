import React from "react";

const ChartCard = ({ title, children, headerRight }) => {

  return (
    <div className="bg-[#1f2937] p-4 rounded-xl shadow-md border border-gray-700 h-[350px]">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {headerRight && <div>{headerRight}</div>}
      </div>
      <div className=" h-[290px] overflow-y-hidden overflow-x-auto">
        {children}
      </div>
    </div>
  );
};

export default ChartCard;
