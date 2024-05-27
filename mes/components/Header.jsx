'use client'
import React from "react";
import Logo from "./uı/Logo";
import Button from "./uı/Button";
import OrderSearch from "./uı/OrderSearch";
import { usePathname } from 'next/navigation';
function Header() {
  const pathname = usePathname();
  const pageName = pathname.split('/')[1]; // URL'den sayfa ismini alır
  return (
    <header className="w-screen h-[150px] bg-black flex items-center border-b-2 border-secondary shadow-2xl ">
      <div className="container mx-auto">
        <div className="flex items-center justify-between ">
          <Logo />
          <span className="text-white font-semibold font-mono uppercase italic text-[50px]">
            {pageName && pageName}
          </span>
          <div className="flex gap-x-2">
            <Button className="p-3" children="Bölüm Dosyaları" />
            <Button className="p-3" children="Mesai Bilgisi" />
          </div>
          <OrderSearch/>
        </div>
      </div>
    </header>
  );
}

export default Header;
