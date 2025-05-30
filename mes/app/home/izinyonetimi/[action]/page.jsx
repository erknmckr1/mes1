"use client";
import React from "react";
import { useSelector } from "react-redux";
import LeaveManagement from "@/components/izinYonetimSistemi/LeaveManagement";
import { usePathname } from "next/navigation";

export default function İzinYönetimi() {
  const pathName = usePathname();
  const flow = pathName.split("/")[2];

  return (
    <div className="w-full h-full flex justify-center p-4">
      {flow === "izinyonetimi" && <LeaveManagement />}
      
    </div>
  );
}
