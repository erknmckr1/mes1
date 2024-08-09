"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  setProcessList,
  setSelectedProcess,
  setSelectedMachine,
  setMachineList,
} from "@/redux/orderSlice";

const filteredMachine = [
  { machine_name: "Machine A" },
  { machine_name: "Machine B" },
  { machine_name: "Machine C" },
  { machine_name: "Machine D" },
];

function ProcessArea() {
  const [onMachine, setOnMachine] = useState(null);
  const pathname = usePathname();
  const pageName = pathname.split("/")[3]; // URL'den sayfa ismini alır 2. parametreyi aldık.
  const dispatch = useDispatch();
  const { processList, selectedProcess, selectedMachine,machineList } = useSelector(
    (state) => state.order
  );
  const {theme} = useSelector(theme => theme.global)
  //! İlgili bölüme göre proses listesini getırecek istek...
  const getProcessList = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/getProcessTypes`,
        {
          params: { area_name: pageName },
        }
      );
      dispatch(setProcessList(response.data));

      // kalite ekranında default olarak Genel kontrol secılı gelsın...
      if (pageName === "kalite") {
        const genelKontrolProcess = response.data.find(
          (process) => process.process_name === "Genel (Tümü) Kontrol"
        );
  
        if (genelKontrolProcess) {
          dispatch(setSelectedProcess(genelKontrolProcess));
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  console.log(selectedProcess)
  //! ilgili makine listesini getirecek query
  const getMachineList = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/getMachineList`,
        {
          params: { area_name: pageName },
        }
      );
      dispatch(setMachineList(response.data));
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getProcessList();
    getMachineList();
  }, []);

  return (
    <div className={`w-full h-full overflow-y-auto transition-all  tablearea ${theme} border-secondary border-2`}>
      <div className="w-full h-full flex">
        <div className={`${pageName === "kalite" ? "w-full" :"w-1/2"} h-full flex flex-col`}>
          <div className={`px-6 py-3 text-left text-xs thead ${theme}   font-medium uppercase tracking-wider`}>
            {pageName === "kalite" ? "Kontrol Türleri" :"Prosesler"}
          </div>
          <ul className="overflow-y-auto text-center bg-white border-t-2">
            {processList &&
              processList.map((item, index) => (
                <li
                  onClick={() =>
                    dispatch(setSelectedProcess(item))
                  }
                  key={item.process_id}
                  className={`p-2 hover:bg-green-600 border cursor-pointer  ${
                    selectedProcess.process_name === item.process_name
                      ? "bg-green-600 text-white font-semibold transition-all"
                      : `listeleman ${theme}`
                  }`}
                >
                  {item.process_name}
                </li>
              ))}
          </ul>
        </div>
        { pageName !== "kalite"  && <div className="w-1/2 h-full flex flex-col bg-white">
          <div className="px-6 py-3 text-left text-xs bg-secondary  font-medium uppercase tracking-wider">
            Makineler
          </div>
          <ul className="overflow-y-auto bg-white text-center border-t-2">
            {
             machineList && machineList.map((item, index) => (
                <li
                  key={index}
                  className={`p-2 hover:bg-green-600 border cursor-pointer ${
                    onMachine === item.machine_name ? "bg-green-500" : ""
                  }`}
                  onClick={() => setOnMachine(item.machine_name)}
                >
                  {item.machine_name}
                </li>
              ))}
          </ul>
        </div>}
      </div>
    </div>
  );
}

export default ProcessArea;
