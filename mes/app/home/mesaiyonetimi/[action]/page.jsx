"use client";
import React from "react";
import { usePathname } from "next/navigation";
import ShiftManagement from "@/components/mesaiYonetimi/ShiftManagement";

function page() {
  const pathName = usePathname();
  const flow = pathName.split("/")[2];
  return (
    <div className="w-full h-full flex justify-center items-center">
      {flow === "mesaiyonetimi" && <ShiftManagement />}
    </div>
  );
}

export default page;
