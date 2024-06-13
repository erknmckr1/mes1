"use client";
import React, { useEffect, useState } from "react";

function CurrentDate() {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDate(new Date());
    }, 1000); // Update every second

    return () => clearInterval(timer); // Cleanup on unmount
  }, []);

  return (
    <div className="flex flex-col justify-center w-full h-full items-center gap-y-3 text-[60px] text-secondary font-semibold">
      <span>{date.toLocaleTimeString()}</span>
      <span>{date.toLocaleDateString()}</span>
    </div>
  );
}

export default CurrentDate;
