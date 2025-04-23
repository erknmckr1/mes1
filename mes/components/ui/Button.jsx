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
      className={` 
        ${disabled
          ? "bg-gray-600 text-gray-300 cursor-not-allowed opacity-50"
          : "hover:scale-105 active:scale-75 transition-all duration-300"
        } 
        text-white font-bold rounded-lg shadow-md 
        ${theme} bg-blue-500 hover:bg-blue-600
        py-4 px-2 lg:py-[15px]  lg:px-[40px] text-center 
        ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default Button;
