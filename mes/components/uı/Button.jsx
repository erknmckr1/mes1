import React from "react";

function Button({
  disabled,
  onClick,
  children,
  type = "button",
  className = "",
}) {
  return (
    <button
      type={type}
      className={`bg-blue-500 hover:bg-blue-600 text-white font-bold  py-[15px] px-[40px] rounded text-center ${className} ${
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
