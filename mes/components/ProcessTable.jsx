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

function ProcessArea() {
  const [onMachine, setOnMachine] = useState(null);
  const pathname = usePathname();
  const pageName = pathname.split("/")[3]; // URL'den sayfa ismini alır 2. parametreyi aldık.
  const dispatch = useDispatch();
  const {
    processList,
    selectedProcess,
    selectedMachine,
    machineList,
    selectedHammerSectionField,
  } = useSelector((state) => state.order);
  const { theme } = useSelector((theme) => theme.global);

  //! İlgili bölüme göre proses listesini getırecek istek...
  const getProcessList = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/getProcessTypes`,
        {
          params: { area_name: pageName },
        }
      );

      let processes = response.data;

      // Eğer cekic ekranıysa ve selectedHammerSectionField 'Makine' değilse, processList'i boş dizi yap
      if (pageName === "cekic" && selectedHammerSectionField !== "makine") {
        processes = [];
        dispatch(setSelectedProcess(""));
      }

      dispatch(setProcessList(processes));

      // kalite ekranında default olarak Genel kontrol secili gelsin
      if (pageName === "kalite") {
        const genelKontrolProcess = processes.find(
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

  //! ilgili makine listesini getirecek query
  const getMachineList = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/getMachineList`,
        {
          params: { area_name: pageName },
        }
      );

      let machines = response.data;

      // Eğer cekic ekranıysa ve selectedHammerSectionField 'Makine' değilse, setMachineList'i boş dizi yap
      if (pageName === "cekic" && selectedHammerSectionField !== "makine") {
        machines = [];
        dispatch(setSelectedProcess(""));
      }

      dispatch(setMachineList(machines));
      setOnMachine([]);
    } catch (err) {
      console.log(err);
    }
  };

  const filteredMachine = () => {
    if (!machineList || !selectedProcess) {
      return;
    }
    const filtered = machineList.filter(
      (item) => item.process_name === selectedProcess.process_name
    );
    setOnMachine(filtered);
  };

  useEffect(() => {
    filteredMachine();
  }, [selectedProcess]);

  useEffect(() => {
    getProcessList();
    getMachineList();
  }, [selectedHammerSectionField, pageName]);

  const handleSelected = (name, item) => {
    if (name === "process") {
      const isSelectedProcess =
        selectedProcess?.process_name === item.process_name;
      dispatch(setSelectedProcess(isSelectedProcess ? {} : item));
    } else if (name === "machine") {
      const isSelectedMachine =
        selectedMachine?.machine_name === item.machine_name;
      dispatch(setSelectedMachine(isSelectedMachine ? {} : item));
    }
  };
  
  return (
    <div
      className={`w-full h-full overflow-y-auto transition-all  tablearea ${theme} border-secondary border-2`}
    >
      <div className="w-full h-full flex">
        <div
          className={`${
            pageName === "kalite" ? "w-full" : "w-1/2"
          } h-full flex flex-col`}
        >
          <div
            className={`px-6 py-3 text-left text-xs thead ${theme}   font-medium uppercase tracking-wider`}
          >
            {pageName === "kalite" ? "Kontrol Türleri" : "Prosesler"}
          </div>
          <ul className="overflow-y-auto text-center bg-white border-t-2">
            {processList &&
              processList.map((item, index) => (
                <li
                  onClick={() => handleSelected("process", item)}
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
        {pageName !== "kalite" && (
          <div className="w-1/2 h-full flex flex-col border-l">
            <div
              className={`px-6 py-3 text-left text-xs ${theme} thead   font-medium uppercase tracking-wider`}
            >
              Makineler
            </div>
            <ul className="overflow-y-auto text-center bg-white border-t-2">
              {onMachine &&
                onMachine.map((item, index) => (
                  <li
                    key={index}
                    className={`p-2 hover:bg-green-600 border cursor-pointer ${
                      selectedMachine.machine_name === item.machine_name
                        ? "bg-green-500"
                        : `listeleman ${theme}`
                    }`}
                    onClick={() => handleSelected("machine", item)}
                  >
                    {item.machine_name}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProcessArea;
