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
    if (!machineList || !selectedProcess) return;

    let filtered = [];

    // tel cekme gibi ekranıda bir makine birden fazla proses için kullanıldıgından grupladık. 
    if (pageName === "telcekme") {
      filtered = machineList.filter(
        (item) => item.machine_group === selectedProcess.process_group
      );
    } else {
      filtered = machineList.filter(
        (item) => item.process_name === selectedProcess.process_name
      );
    }

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
      if (!isSelectedProcess) {
        dispatch(setSelectedMachine({})); // Process değiştiğinde machine'i
      }
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
            pageName === "kalite" || pageName === "cila" ? "w-full" : "w-1/2"
          } h-full flex flex-col `}
        >
          {pageName !== "cila" && (
            <div
              className={`px-6 py-3 text-left text-xs thead ${theme}   font-medium uppercase tracking-wider`}
            >
              {pageName === "kalite" ? "Kontrol Türleri" : "Prosesler"}
            </div>
          )}
          {pageName === "cila" ? (
            <div className="flex flex-wrap justify-center gap-3 p-[15px]">
              {processList?.map((item) => {
                const isSelected =
                  selectedProcess.process_name === item.process_name;
                return (
                  <div
                    key={item.process_id}
                    onClick={() => handleSelected("process", item)}
                    className={`p-3 rounded-full  border text-xs text-center break-words font-bold shadow 
                   ${
                     isSelected
                       ? "bg-green-600 text-white border-green-600 scale-110 "
                       : "bg-white text-black border-gray-300"
                   } 
                   hover:bg-green-500 hover:text-white cursor-pointer transition-all duration-200 w-20 h-20  flex items-center justify-center`}
                  >
                    {item.process_name}
                  </div>
                );
              })}
            </div>
          ) : (
            // eski liste görünümü (default)
            <ul className="overflow-y-auto text-center bg-white border-t-2">
              {processList?.map((item) => (
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
          )}
        </div>
        {/* kalite ve cila ekranlarında makine kısmını gostermıyoruz. */}
        {pageName !== "kalite" && pageName !== "cila" && (
          <div className="w-1/2 h-full flex flex-col border-l">
            <div
              className={`px-6 py-3 text-left text-xs ${theme} thead font-medium uppercase tracking-wider`}
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
