import React from "react";
import { BarChart, BarSeries } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { useSelector } from "react-redux";

export function ShiftChart() {
  const { usersOnShifts } = useSelector((state) => state.shift);
  // Sabit x ekseni kategorileri (bölüm isimleri)
  const defaultSections = [
    "Montaj",
    "BilgiIslem",
    "Atolye",
    "Boyama",
    "Yaldız",
    "Diğer",
  ];

  // Bugünün tarihini YYYY-MM-DD formatında alın
  const today = new Date().toISOString().split("T")[0]; // Örn: "2024-11-22"

  // start_date bugünün tarihine eşit olan verileri filtreleyin
  const todayShifts = usersOnShifts.filter(
    (shift) => shift.start_date === today
  );

  // Veriyi op_section'a göre gruplandır ve sayım yap
  const sectionCounts = todayShifts.reduce((acc, shift) => {
    const section = shift.User?.op_section || "Diğer";
    acc[section] = (acc[section] || 0) + 1;
    return acc;
  }, {});

  // Default x ekseni için veri hazırlama
  const chartData = defaultSections.map((section) => ({
    section,
    count: sectionCounts[section] || 0, // Kategori yoksa 0 olarak ayarlanır
  }));

  return (
    <BarChart
      series={[
        {
          data: chartData.map((data) => data.count), // Her bölümün mesai sayıları
          style: { barThickness: 25 }, // Bar kalınlığı
        },
      ]}
      height={300}
      width={600}
      xAxis={[
        {
          data: chartData.map((data) => data.section), // Bölüm isimleri (op_section)
          scaleType: "band",
        },
      ]}
      margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
    />
  );
}

export function WeeklyShiftTrendChart() {
  const { usersOnShifts } = useSelector((state) => state.shift);
  const today = new Date();

  // Geçmiş 7 günün tarihlerini oluştur
  const last7Days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    return date.toISOString().split("T")[0]; // YYYY-MM-DD formatı
  }).reverse(); // Tarih sırasını düzgün hale getirmek için ters çevir

  // Her gün için kaç mesai kaydı olduğunu hesapla
  const dailyShiftCounts = last7Days.map((date) => {
    const count = usersOnShifts.filter(
      (shift) => shift.start_date === date
    ).length;
    return { date, count };
  });

  return (
    <LineChart
      series={[
        {
          data: dailyShiftCounts.map((data) => data.count), // Mesai sayıları
        },
      ]}
      xAxis={[
        {
          data: dailyShiftCounts.map((data) => data.date), // Tarihler
          scaleType: "band",
        },
      ]}
      height={300}
      width={600}
      margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
    />
  );
}
