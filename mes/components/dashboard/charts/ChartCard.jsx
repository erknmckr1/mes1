import React from "react";

const ChartCard = ({ title, children }) => {
  return (
    <div className="bg-[#1f2937] p-4 rounded-xl shadow-md border border-gray-700 h-[350px]">
      <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
      <div className="h-full flex justify-center items-center">{children}</div>
    </div>
  );
};

export default ChartCard;
