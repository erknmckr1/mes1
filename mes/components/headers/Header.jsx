'use client'
import React from "react";
import Logo from "../ui/Logo";
import Button from "../ui/Button";
import OrderSearch from "../ui/OrderSearch";
import { usePathname } from 'next/navigation';
import ThemeButton from "../ui/ThemaButton";
import { useSelector } from "react-redux";
import ReloadButton from "../ui/ReloadButton";

function Header() {
  const pathname = usePathname();
  const area_name = pathname.split('/')[3]; // URL'den sayfa ismini alır,
  const {theme} = useSelector(state =>state.global)
  return (
    <header className={`w-screen h-[150px] header ${theme} flex items-center border-b-4 border-secondary shadow-2xl transition-all`}>
      <div className="container mx-auto">
        <div className="flex items-center justify-between ">
          <Logo />
          <span className=" font-semibold font-mono uppercase italic text-[50px]">
            {area_name && area_name}
          </span>
          <div className="flex gap-x-2">
            <Button className="p-3" children="Bölüm Dosyaları" />
            <Button className="p-3" children="Mesai Bilgisi" />
          </div>
          <OrderSearch/>
          <div className="flex gap-x-6">
          <ThemeButton/>
          <ReloadButton theme={theme}/>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
