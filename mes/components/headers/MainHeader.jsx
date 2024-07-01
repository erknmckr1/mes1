'use client'
import React from "react";
import Logo from "../uı/Logo";
import { usePathname } from 'next/navigation';

function MainHeader() {
    const pathname = usePathname();
    const area_name = pathname.split('/')[1]; // URL'den sayfa ismini alır
  return (
    <header className="w-screen h-[150px] bg-black flex items-center border-b-2 border-secondary shadow-2xl ">
    <div className="container mx-auto">
      <div className="flex items-center justify-between ">
        <Logo />
        <span className="text-white font-semibold font-mono uppercase italic text-[50px]">
          {area_name === "home" && "Ana Sayfa"}
        </span>
        <div className="flex gap-x-2">
        </div>
      </div>
    </div>
  </header>
  )
}

export default MainHeader
