import React from "react";
import { setFilters } from "@/redux/dashboardSlice";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  fetchProcessesData,
  fetchAreaData,
  fetchMachinesData,
  setDashboardData,
  setDailyChartData,
  setExportData,
} from "@/redux/dashboardSlice";
import axios from "axios";
import { toast } from "react-toastify";
import Button from "@/components/ui/Button";
const FilterPanel = () => {
  const {
    filters,
    sectionData,
    processData,
    areaData,
    machineData,
    dashboardData,
    exportData,
  } = useSelector((state) => state.dashboard);
  const router = useRouter();
  const dispatch = useDispatch();
  // filter objesini güncelleyen fonksiyon
  const handleChangeFilterObj = (name, value) => {
    dispatch(setFilters({ ...filters, [name]: value }));
  };

  // get Area Data
  useEffect(() => {
    if (filters.section) {
      dispatch(fetchAreaData(filters.section));
    }
  }, [filters.section]);

  // get Process Data
  useEffect(() => {
    if (filters.areaName) {
      dispatch(fetchProcessesData(filters.areaName));
    }
  }, [filters.areaName]);

  // get Machine Data
  useEffect(() => {
    if (filters.prosess && filters.prosess !== "all") {
      dispatch(fetchMachinesData(filters.prosess));
    }
  }, [filters.prosess]);

  //! fet filtered WorkLog Data
  const fetchFilteredData = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/analytics/getWorksCountSummary`,
        {
          params: {
            section: filters.section,
            areaName: filters.areaName,
            machine: filters.machine,
            process: filters.prosess,
            startDate: filters.startDate,
            endDate: filters.endDate,
          },
        }
      );
      if (response.status === 200 && response.data.data) {
        dispatch(setDashboardData(response.data.data));
        toast.success(response.data.message || "Veriler başarıyla yüklendi.");
      } else {
        toast.error(response.data.message || "Beklenmeyen bir hata oluştu.");
      }
    } catch (err) {
      console.log(err);
      toast.error("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  const fetchDailyProductionStats = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/analytics/getDailyProductionStats`,
        {
          params: {
            section: filters.section,
            areaName: filters.areaName,
            machine: filters.machine,
            process: filters.prosess,
            startDate: filters.startDate,
            endDate: filters.endDate,
          },
        }
      );
      if (response.status === 200) {
        console.log("Günlük veri", response.data.data);
        dispatch(setDailyChartData(response.data.data)); // örnek
      }
    } catch (err) {
      console.error("Chart verisi alınamadı", err);
    }
  };

  // Filtre butonuna basınca hem özet hem günlük verileri getir
  const handleFetchAllData = async () => {
    await fetchFilteredData();
    await fetchDailyProductionStats();
  };

  //! Export için veri cekecek ve sonrasında sayfa yönlendirmesi yapacak fonksiyon...
  const handleExportData = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/analytics/getWorkLogData`,
        {
          params: {
            params: {
              section: filters.section.toLowerCase(),
              area_name: filters.areaName.toLowerCase(),
              machine: filters.machine,
              process: filters.prosess,
              startDate: filters.startDate,
              endDate: filters.endDate,
            },
          },
        }
      );

      if (response.status === 200) {
        dispatch(setExportData(response.data.data));
        router.push(
          `${process.env.NEXT_PUBLIC_BASE_URL}/home/analytics/export`
        );
      } else if (response.status === 404) {
        toast.error(`${response.data.message}` || "Filtrelenen veri bulunamadı.");
      }
    } catch (err) {
      console.log(err);
      toast.error(`${err.response.data.message}` || "Filtrelenen veri çekilemedi.");
    }
  };


  const dataType = [
    {
      name: "Sipariş Verisi",
      key: "work_log"
    },
    {
      name: "Ölçüm Verisi",
      key: "measurement_data"
    }
  ]

  return (
    <div className="p-6 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 space-y-5 text-black ">
      <h2 className="text-xl font-semibold text-gray-800">
        🔎 Filtreleme Paneli
      </h2>

      {/* Bölüm */}
      <div className="space-y-1">
        <label className="block text-sm text-gray-600 font-medium">Kat</label>
        <select
          value={filters.section}
          onChange={(e) => handleChangeFilterObj("section", e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tüm Bölümler</option>
          {sectionData?.map((section, index) => (
            <option value={section.section} key={index}>
              {section.section}
            </option>
          ))}
        </select>
      </div>
      {/* Birim */}
      <div className="space-y-1">
        <label className="block text-sm text-gray-600 font-medium">Birim</label>
        <select
          value={filters.areaName}
          onChange={(e) => handleChangeFilterObj("areaName", e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tüm Birimler</option>
          {areaData?.map((area_name, index) => (
            <option value={area_name.area_name} key={index}>
              {area_name.area_name}
            </option>
          ))}
        </select>
      </div>
      {/* Prosess */}
      <div className="space-y-1">
        <label className="block text-sm text-gray-600 font-medium">
          Proses
        </label>
        <select
          value={filters.prosess}
          onChange={(e) => handleChangeFilterObj("prosess", e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tüm Prosesler</option>
          {processData?.map((process, index) => (
            <option value={process.process_name} key={index}>
              {process.process_name}
            </option>
          ))}
        </select>
      </div>
      {/* Makine */}
      <div className="space-y-1">
        <label className="block text-sm text-gray-600 font-medium">
          Makine
        </label>
        <select
          value={filters.machine}
          onChange={(e) => handleChangeFilterObj("machine", e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tüm Makineler</option>
          {machineData?.map((machine, index) => (
            <option value={machine.machine_name} key={index}>
              {machine.machine_name}
            </option>
          ))}
        </select>
      </div>

      {/* Tarih Aralığı flex-1 class ı esnek olan elemenletın kalan alanı eşit şekilde paylaşmasını sağlar.  */}
      <div className="flex gap-3">
        <div className="flex-1 space-y-1">
          <label className="block text-sm text-gray-600 font-medium">
            Başlangıç
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleChangeFilterObj("startDate", e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1 space-y-1">
          <label className="block text-sm text-gray-600 font-medium">
            Bitiş
          </label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleChangeFilterObj("endDate", e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      {/*Data filters checkbox*/}
      <div className="flex items-center gap-6 my-4">
        {
          dataType.map((item) => (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" className="accent-blue-600 w-4 h-4" />
              {item.name}
            </label>
          ))
        }
      </div>

      {/* buttons */}
      <div className="flex gap-x-3 items-center w-full">
        <Button
          onClick={handleFetchAllData}
          className=" bg-blue-600 text-white rounded-lg p-2.5 shadow-sm hover:bg-blue-700 transition duration-200"
        >
          Filtrele
        </Button>
        <Button
          onClick={handleExportData}
          className="bg-blue-600 text-white rounded-lg p-2.5 shadow-sm hover:bg-blue-700 transition duration-200"
        >
          Dışarıya Veri Al
        </Button>
      </div>
    </div>
  );
};

export default FilterPanel;
