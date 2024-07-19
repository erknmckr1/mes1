import React from "react";
import Button from "@/components/ui/Button";
import IzinForm from "./parts/İzinForm";
import LeaveTable from "./parts/LeaveTable";
import { useState } from "react";
import UserCard from "./UserCard";
function LeaveManagement() {
  const [tab, setTab] = useState("1");

  return (
    <div className="h-full w-[85%]  flex items-center  gap-x-3 px-4">
      <div className="w-full h-2/3 flex gap-x-4 justify-center">
        {/* user info */}
        <UserCard/>
        {/* süreç ekranlarındaki sağ taraf */}
        <div className="bg-slate-400 max-h-full  rounded-md shadow-md w-2/3">
          <div className="bg-slate-400 rounded-sm">
            <h1 className="text-2xl rounded-md text-center uppercase text-black font-bold py-2 ps-4 w-full  ">
              {tab === "1" && "Yeni İzin Talebi"}
              {tab === "2" && "Bekleyen İzin Talepleri"}
            </h1>
            <div className="border-b flex justify-center gap-x-3 py-1 ps-4 ">
              <Button
                onClick={() => setTab("1")}
                className={`px-4 py-2 ${
                  tab === "1"
                    ? "bg-secondary !text-black hover:bg-secondary"
                    : ""
                }`}
              >
                Yeni İzin
              </Button>
              <Button onClick={() => setTab("2")} className={`px-4 py-2 ${
                  tab === "2"
                    ? "bg-secondary !text-black hover:bg-secondary"
                    : ""
                }`}>
                Bekleyen
              </Button>
              <Button className="px-4 py-2">Onaylanan</Button>
              <Button className="px-4 py-2">Geçmiş İzinlerim</Button>
            </div>
          </div>
          {/* izin talep formu */}
          <div className="w-full h-full mt-1">
            {tab === "1" && <IzinForm />}
            {tab === "2" && <LeaveTable />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeaveManagement;
