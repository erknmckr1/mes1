import * as React from "react";
import { PieChart } from "@mui/x-charts";

// İş durumu etiketi
const getStatusLabel = (status) => {
  switch (status) {
    case "1":
      return "Devam Ediyor";
    case "2":
      return "Durduruldu";
    case "3":
      return "İptal Edildi";
    case "4":
      return "Tamamlandı";
    default:
      return "Bilinmiyor";
  }
};

// Renk paleti (opsiyonel dışa taşıyabilirsin)
const tokens = ["#0284c7", "#16a34a", "#dc2626", "#f59e0b"];


export default function Pie({ data }) {
  const chartData = data?.map((item, index) => ({
    id: index,
    value: Number(item.total),
    label: getStatusLabel(item.work_status),
    color: tokens[index % tokens.length],
  })) || [];

  return (
    <div className="w-full flex items-center">
      {/* Grafik */}
      <PieChart
        series={[
          {
            data: chartData,
            innerRadius: 30,
            outerRadius: 90,
            paddingAngle: 5,
            cornerRadius: 5,
            startAngle: -45,
            endAngle: 315,
            cx: 30,
            cy: 150,
          },
        ]}
        width={200}
        height={300}
        slotProps={{
          legend: { hidden: true },
        }}
        sx={{
          ".MuiChartsArc-label": {
            fill: "#fff",
            fontSize: 13,
          },
        }}
      />

      {/* Legend */}
      <ul className="space-y-2 text-white text-sm ">
        {chartData.map((item) => (
          <li key={item.id} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-sm inline-block"
              style={{ backgroundColor: item.color }}
            />
            {item.label} ({item.value})
          </li>
        ))}
      </ul>
    </div>
  );
}
