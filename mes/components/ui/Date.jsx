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
    <div className="flex flex-col justify-center w-full h-full items-center gap-y-4 text-4xl md:text-5xl text-secondary font-bold transition-all duration-300 ease-in-out">
      
      {/* Saat */}
      <span className={`${addProps} shadow-md px-6 py-2 rounded-lg bg-opacity-50`}>
        {date.toLocaleTimeString()}
      </span>
  
      {/* Ayırıcı Çizgi */}
      <div className="w-24 h-1 bg-secondary rounded-full opacity-50"></div>
  
      {/* Tarih */}
      <span className="text-2xl md:text-3xl opacity-90">
        {date.toLocaleDateString()}
      </span>
    </div>
  );
}

export default CurrentDate;
