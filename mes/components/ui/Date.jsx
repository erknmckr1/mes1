"use client";
import React, { useEffect, useState } from "react";

function CurrentDate({addProps}) {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDate(new Date());
    }, 1000); // Update every second

    return () => clearInterval(timer); // Cleanup on unmount
  }, []);

  return (
    <div className="flex flex-col justify-center w-full h-full items-center gap-y-1 text-secondary font-bold transition-all duration-300 ease-in-out">
      
      {/* Saat */}
      <span className={`${addProps} text-[40px] shadow-md lg:px-6 lg:py-2 rounded-lg bg-opacity-50`}>
        {date.toLocaleTimeString()}
      </span>
  
      {/* Ayırıcı Çizgi */}
      <div className="w-24 h-1 bg-secondary rounded-full opacity-50"></div>
  
      {/* Tarih */}
      <span className="text-xs opacity-90">
        {date.toLocaleDateString()}
      </span>
    </div>
  );
}

export default CurrentDate;
