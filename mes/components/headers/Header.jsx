"use client";
import React from "react";
import Logo from "../ui/Logo";
import Button from "../ui/Button";
import OrderSearch from "../ui/OrderSearch";
import { usePathname, useSearchParams } from "next/navigation";
import ThemeButton from "../ui/ThemaButton";
import { useSelector } from "react-redux";
import ReloadButton from "../ui/ReloadButton";
import Date from "../ui/Date";
function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const panel = searchParams.get("panel"); // 1 veya 2
  const area_name = pathname.split("/")[3]; // URL'den sayfa ismini alır,
  const { theme } = useSelector((state) => state.global);
  return (
    <header
      className={`w-screen h-[150px] header ${theme} flex items-center border-b-4 border-secondary shadow-2xl transition-all`}
    >
      <div className="lg:container mx-auto w-full">
        {/* header ıtems */}
        <div className={"flex items-center justify-between w-full"}>
          {area_name === "cila" && panel === "2" ? (
            <div className="w-[20%] h-full ">
              <Date addProps="lg:text-[80px]" />
            </div>
          ) : (
            ""
          )}
          {(area_name !== "cila" || panel === "1") && <Logo />}
          <span className="font-semibold font-mono uppercase italic text-[50px]">
            {area_name}
            {area_name === "cila" && panel ? panel : ""}
          </span>
          {/* dosya butonları */}
          <div className="flex flex-col gap-y-1 lg:flex-row lg:gap-y-0 lg:gap-x-2">
            <Button className="p-3">
              <span className="block lg:hidden">Bölüm D.</span>
              <span className="hidden lg:block">Bölüm Dosyaları</span>
            </Button>

            <Button className="p-3">
              <span className="block lg:hidden">Mesai B.</span>
              <span className="hidden lg:block">Mesai Bilgisi</span>
            </Button>
          </div>
          {<OrderSearch />}
          <div className="flex flex-col mr-1 lg:mr-0 gap-y-1 lg:flex-row lg:gap-y-0  gap-x-6">
            <ThemeButton />
            <ReloadButton theme={theme} />
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
