import * as React from "react";
import { PieChart } from "@mui/x-charts";

export default function Pie() {
  // Aynı datayı grafik ve legend için kullanıyoruz
  const data = [
    { id: 0, value: 10, label: "Tel Çekme", color: "#06b6d4" },  // cyan-500
    { id: 1, value: 20, label: "Cila", color: "#3b82f6" },        // blue-500
    { id: 2, value: 15, label: "Buzlama", color: "#a855f7" },     // purple-500
    { id: 3, value: 25, label: "Kalite", color: "#7c3aed" },      // violet-600
    { id: 4, value: 30, label: "Diğer", color: "#1d4ed8" },       // indigo-700
  ];

  return (
    <div className="w-full flex items-center justify-between">
      {/* PieChart */}
      <PieChart
        series={[
          {
            innerRadius: 30,
            outerRadius: 90,
            paddingAngle: 5,
            cornerRadius: 5,
            startAngle: -45,
            endAngle: 315,
            cx:30,
            cy: 150,
            data: data.map(({ id, value, label, color }) => ({
              id,
              value,
              label,
              color,
            })),
          },
        ]}
        width={300}
        height={300}
        slotProps={{
          legend: { hidden: true }, // default legend kapat
        }}
        sx={{
          ".MuiChartsArc-label": {
            fill: "#fff",
            fontSize: 13,
          },
        }}
      />

      {/* Manuel Legend */}
      <ul className="space-y-2 text-white text-sm">
        {data.map((item) => (
          <li key={item.id} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-sm inline-block"
              style={{ backgroundColor: item.color }}
            ></span>
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
