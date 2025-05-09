import React from "react";

function DashboardCardElement({ name, info }) {
  return (
    <div className="bg-[#111827] text-white px-4 py-3 rounded-lg border border-gray-700 shadow">
      🏭 <strong>{name}:</strong> {info}
    </div>
  );
}

export default DashboardCardElement;
