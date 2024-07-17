import React from 'react'
import Button from "@/components/ui/Button";
import IzinForm from './parts/İzinForm';
function LeaveManagement() {
  return (
    <div className="h-full w-[85%] bg-gray-100 flex items-center  gap-x-3 px-4">
          <div className="w-full h-2/3 flex gap-x-4 justify-center">
          {/* user info */}
            <div className="w-1/3 h-[60%]  rounded-lg bg-[#e2806a] shadow-md   ">
              <div className="w-full flex justify-evenly py-10 border-b ">
                <img
                  className=" rounded-full h-[100px]"
                  src="./avatar2.jpg"
                  alt="profilpic"
                />
                <div className="flex flex-col gap-y-2 text-black  ">
                  <span className="text-[30px] font-semibold">
                    Erkan Mustafa Çakir
                  </span>
                  <span className="text-xl font-medium">
                    Yazılım Geliştirici
                  </span>
                  <span>123321123321</span>
                  <span className="underline">Yıllık izin bakiyesi: 20</span>
                </div>
              </div>
              <div className="flex flex-col text-black ">
                <button className=" hover:bg-gray-700 hover:text-white transition-all py-3 ps-4 text-start border-b w-full">İzin Taleplerim</button>
                <button className=" hover:bg-gray-700 hover:text-white transition-all py-3 ps-4 text-start border-b w-full">Geçmiş İzin Taleplerim</button>
              </div>
            </div>
            {/* süreç ekranlarındaki sağ taraf */}
            <div className="bg-white max-h-full  rounded-md shadow-md w-2/3">
             <div className="bg-slate-400 rounded-sm">
             <h1 className="text-2xl rounded-md text-black font-bold py-2 ps-4 w-full  ">
                Yeni İzin Talebi
              </h1>
              <div className="border-b flex gap-x-3 py-1 ps-4 ">
                <Button className="px-4 py-2">Yeni İzin</Button>
                <Button className="px-4 py-2">Bekleyen</Button>
                <Button className="px-4 py-2">Onaylanan</Button>
                <Button className="px-4 py-2">Geçmiş İzinlerim</Button>
              </div>
             </div>
              {/* izin talep formu */}
              <IzinForm/>
            </div>
          </div>
        </div>
  )
}

export default LeaveManagement
