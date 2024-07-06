"use client"
import React from "react";
import { useSelector } from "react-redux";
function Button({
  disabled,
  onClick,
  children,
  type = "button",
  className = "",
}) {
  const {theme} = useSelector(theme => theme.global)
  return (
    <button
      type={type}
      className={`bg-blue-500 hover:bg-blue-600 text-white font-bold button ${theme} py-[15px] px-[40px] rounded text-center ${className} ${
        disabled ? "bg-gray-600 hover:bg-gray-600" : ""
      } `}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default Button;
