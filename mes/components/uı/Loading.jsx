import Image from "next/image";
import React from "react";
Image;
function Loading() {
  return (
    <div className="w-screen h-screen top-0 left-0 absolute">
      <div className="flex items-center justify-center w-full h-full  ">
        <div className="w-[700px] text-white h-[500px] bg-black border-2 border-white p-3 static z-50 rounded-md ">
          <div className="w-full h-full flex flex-col items-center gap-y-20">
            <div className="h-[100px] w-full bg-secondary flex justify-center items-center text-black font-semibold">
              <h1 className="text-[50px]"> Sayfa Yükleniyor...</h1>
            </div>
            <Image width={400} height={400} alt="" src="/midas_logo.png" />
          </div>
        </div>
      </div>
      <div className="w-screen h-screen absolute bg-transparent opacity-85 top-0 left-0"></div>
    </div>
  );
}

export default Loading;
