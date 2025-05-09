import React from "react";
import { BarChart } from "@mui/x-charts";

import ChartCard from "./ChartCard";

function DailyProductionChart({items,title}) {

  return (
    
      <BarChart
        series={[{ data: items.values }]}
        height={290}
        xAxis={[
          {
            data: items.labels,
            scaleType: "band",
            tickLabelStyle: {
              fill: "#fff",
              fontSize: 14,
            },
            axisLineStyle: {
              stroke: "#fff",
            },
          },
        ]}
        yAxis={[
          {
            tickLabelStyle: {
              fill: "#fff",
              fontSize: 14,
            },
            axisLineStyle: {
              stroke: "#fff",
            },
          },
        ]}
        grid={{
          horizontal: true,
          vertical: false,
          lineStyle: {
            stroke: "#4b5563",
            strokeDasharray: "4 4",
          },
        }}
      />
   
  );
}

export default DailyProductionChart;
