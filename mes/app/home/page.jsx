"use client";
import HomeSidebars from "@/components/sideBars/HomeSidebars";
import LeaveManagement from "@/components/izinYonetimSistemi/LeaveManagement";
import { useSelector } from "react-redux";
export default function Home() {
  const {selectedFlow} = useSelector(state => state.global)
  return (
    <main className="h-screen w-screen">
      <div className="w-full h-full flex">
        {/* left side menu sayfanın %15 ını kullanıyor*/}
        <HomeSidebars/>
        {/* right side genıslık olarak %85 ını kullanıyoruz. */}
        {selectedFlow === "İzin Talebi Oluştur" && <LeaveManagement/>}
      </div>
    </main>
  );
}
