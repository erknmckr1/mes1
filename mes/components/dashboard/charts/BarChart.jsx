import React from "react";
import { BarChart } from "@mui/x-charts";

function DailyProductionChart({ items }) {
 const chartWidth = Math.max(items.labels.length * 60, 800); // minimum 800px
  return (
    <div style={{ minWidth: chartWidth }}>
      <BarChart
        width={chartWidth}
        height={290}
        series={[{ data: items.values }]}
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
    </div>
  );
}

export default DailyProductionChart;
