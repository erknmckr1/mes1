import React from "react";
import DashboardCardElement from "./DashboardCardElement";

function DashboardCardGroup({ items = [] }) {
  return (
    <div className="flex gap-3 flex-wrap">
      {items.map((item, index) => (
        <DashboardCardElement
          key={index}
          name={item.label}
          info={item.value}
        />
      ))}
    </div>
  );
}

export default DashboardCardGroup;
