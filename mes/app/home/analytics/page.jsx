"use client";
import React from "react";
import DashboardSection from "@/components/dashboard/section/DashboardSection";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { fetchSectionsData } from "@/redux/dashboardSlice";
function page() {
  const dispatch = useDispatch();

  // bölümleri cekecek useEffect... 
  useEffect(() => {
    dispatch(fetchSectionsData());
  }, []);
  return (
    <div className="w-full h-full p-1 bg-white">
      <DashboardSection />
    </div>
  );
}

export default page;
