"use client";
import HomeSidebars from "@/components/sideBars/HomeSidebars";
import LeaveManagement from "@/components/izinYonetimSistemi/LeaveManagement";
import { useSelector } from "react-redux";
export default function Home() {
  const {selectedManagement} = useSelector(state => state.flowmanagement )
  return (
    <main className="h-screen w-screen">
      <div className="w-full h-full flex">
        {/* left side menu sayfanın %15 ını kullanıyor*/}
        <HomeSidebars/>
        {/* right side genıslık olarak %85 ını kullanıyoruz. */}
        { selectedManagement === "İzin Yönetimi"  &&  <LeaveManagement/>}
      </div>
    </main>
  );
}
