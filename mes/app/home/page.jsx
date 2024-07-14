"use client";
import HomeSidebars from "@/components/sideBars/HomeSidebars";
export default function Home() {
  return (
    <main className="h-screen w-screen">
      <div className="w-full h-full flex">
        {/* left side menu sayfanın %15 ını kullanıyor*/}
        <HomeSidebars/>
        {/* right side */}
        <div className="h-full w-[85%] bg-gray-100 flex items-center  gap-x-3 px-4">
          
        </div>
      </div>
    </main>
  );
}
