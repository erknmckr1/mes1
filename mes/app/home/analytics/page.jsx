"use client";
import React from "react";
import DashboardSection from "@/components/dashboard/section/DashboardSection";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { fetchSectionsData } from "@/redux/dashboardSlice";
import { useSelector } from "react-redux";
function page() {
  const dispatch = useDispatch();
  const { isFilterDataLoading } = useSelector((state) => state.dashboard);
  // bölümleri cekecek useEffect...
  useEffect(() => {
    dispatch(fetchSectionsData());
  }, []);
  return (
    <div className="relative w-full h-full p-1 bg-white">
      {/* İçerik */}
      <DashboardSection />

      {/* Loading Overlay */}
      {isFilterDataLoading && (
        <div className="fixed w-full inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <span className="ml-4 text-gray-700 font-semibold">
            Yükleniyor...
          </span>
        </div>
      )}
    </div>
  );
}

export default page;
