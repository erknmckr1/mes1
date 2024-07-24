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
    <div className={`flex flex-col justify-center w-full h-full items-center gap-y-3 text-[30px]  text-secondary font-semibold `}>
      <span className={`${addProps}`}>{date.toLocaleTimeString()}</span>
      <span>{date.toLocaleDateString()}</span>
    </div>
  );
}

export default CurrentDate;
