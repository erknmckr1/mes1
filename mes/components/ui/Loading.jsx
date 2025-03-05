import Image from "next/image";
import React from "react";
import { useSelector } from "react-redux";
function Loading() {
  const { theme } = useSelector((state) => state.global);
  return (
    <div
      className={`w-screen h-screen top-0 left-0 absolute flex items-center justify-center bg-black bg-opacity-75
        ${theme === "dark" ? "dark-mode" : "light-mode"} `}
    >
      <div className="popup-content sm:w-[700px] w-full h-[300px] sm:h-[500px]   shadow-xl rounded-xl p-6 flex flex-col items-center justify-evenly"> 
        {/* Header */}
        <div className="w-full bg-gradient-to-r popup-header font-bold text-center py-5 rounded-md shadow-md">
          <h1 className="text-[30px] sm:text-[50px]">Sayfa Yükleniyor...</h1>
        </div>

        {/* Loading Animation */}
        <Image
          className="w-32 sm:w-[200px] animate-spin"
          width={200}
          height={200}
          alt="Loading"
          src="/midas_logo.png"
        />
      </div>
    </div>
  );
}

export default Loading;
