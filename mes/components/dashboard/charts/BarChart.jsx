import React from "react";
import { BarChart } from "@mui/x-charts";
import { useSelector } from "react-redux";
import ChartCard from "./ChartCard";

function DailyProductionChart() {
  const { dailyChartData } = useSelector((state) => state.dashboard);

  // Eğer veri yoksa boş array olsun
  const productionData = dailyChartData || [];

  const labels = productionData.map((item) => item.work_start_date);
  const values = productionData.map((item) => item.produced_amount);

  return (
    <ChartCard title="Günlük Üretim Miktarı">
      <BarChart
        series={[{ data: values }]}
        height={290}
        xAxis={[
          {
            data: labels,
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
    </ChartCard>
  );
}

export default DailyProductionChart;
