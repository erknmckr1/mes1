"use client";
import React from "react";
import { useSelector } from "react-redux";

function Button({
  disabled,
  onClick,
  children,
  type = "button",
  className = "",
}) {
  const { theme } = useSelector((state) => state.global);

  return (
    <button
      type={type}
      className={`${
        disabled
          ? "bg-gray-600 hover:bg-gray-600 sm:px-1 sm:py-4  text-sm " 
          : className
      } text-white font-bold button ${theme} bg-blue-500 hover:bg-blue-600 py-3 px-2 sm:py-[15px] sm:px-[40px] rounded text-center`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default Button;
