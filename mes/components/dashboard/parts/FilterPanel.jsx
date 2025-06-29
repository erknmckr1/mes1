import React from "react";
import { setAnalyticFiltersForm } from "@/redux/dashboardSlice";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import OrderMultiSelect from "../uı/OrderMultiSelect";
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
    analyticFiltersForm,
    sectionData,
    processData,
    areaData,
    machineData,
  } = useSelector((state) => state.dashboard);
  const router = useRouter();
  const dispatch = useDispatch();
  // filter objesini güncelleyen fonksiyon
  const handleChangeFilterObj = (name, value) => {
    dispatch(setAnalyticFiltersForm({ ...analyticFiltersForm, [name]: value }));
  };

  // get Area Data
  useEffect(() => {
    if (analyticFiltersForm.section) {
      dispatch(fetchAreaData(analyticFiltersForm.section));
    }
  }, [analyticFiltersForm.section]);

  // get Process Data
  useEffect(() => {
    if (analyticFiltersForm.areaName) {
      dispatch(fetchProcessesData(analyticFiltersForm.areaName));
    }
  }, [analyticFiltersForm.areaName]);

  // get Machine Data
  useEffect(() => {
    if (analyticFiltersForm.prosess && analyticFiltersForm.prosess !== "all") {
      dispatch(fetchMachinesData(analyticFiltersForm.prosess));
    }
  }, [analyticFiltersForm.prosess]);

  //! fet filtered WorkLog Data
  const fetchFilteredData = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/analytics/getWorksCountSummary`,
        {
          params: {
            section: analyticFiltersForm.section,
            areaName: analyticFiltersForm.areaName,
            machine: analyticFiltersForm.machine,
            process: analyticFiltersForm.prosess,
            startDate: analyticFiltersForm.startDate,
            endDate: analyticFiltersForm.endDate,
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
            section: analyticFiltersForm.section,
            areaName: analyticFiltersForm.areaName,
            machine: analyticFiltersForm.machine,
            process: analyticFiltersForm.prosess,
            startDate: analyticFiltersForm.startDate,
            endDate: analyticFiltersForm.endDate,
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
    if (!analyticFiltersForm.dataType) {
      toast.error("Veri türünü seçiniz.(Sipariş-Ölçüm)");
      return;
    }

    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/analytics/getWorkLogData`,
        {
          params: {
            section: analyticFiltersForm.section.toLowerCase(),
            area_name: analyticFiltersForm.areaName.toLowerCase(),
            machine: analyticFiltersForm.machine,
            process: analyticFiltersForm.prosess,
            startDate: analyticFiltersForm.startDate,
            endDate: analyticFiltersForm.endDate,
            dataType: analyticFiltersForm.dataType,
            material_no: analyticFiltersForm.metarial_no,
            order_no: analyticFiltersForm.order_no,
          },
        }
      );

      if (response.status === 200) {
        dispatch(setExportData(response.data.data));
        router.push(
          `${process.env.NEXT_PUBLIC_BASE_URL}/home/analytics/export`
        );
      } else if (response.status === 404) {
        toast.error(response.data.message || "Filtrelenen veri bulunamadı.");
      }
    } catch (err) {
      console.log(err);
      toast.error(
        err.response?.data?.message || "Filtrelenen veri çekilemedi."
      );
    }
  };

  const dataType = [
    {
      name: "Sipariş Verisi",
      key: "work_log",
    },
    {
      name: "Ölçüm Verisi",
      key: "measurement_data",
    },
  ];

  return (
  <div className="p-6 bg-gradient-to-br w-full from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 space-y-4 text-black">
    <h2 className="text-xl font-semibold text-gray-800">
      🔎 Filtreleme Paneli
    </h2>

    {/* Veri Türü Seçimi */}
    <div className="flex flex-wrap gap-4">
      {dataType.map((item) => (
        <label
          key={item.key}
          className="flex items-center gap-2 text-sm text-gray-700"
        >
          <input
            type="radio"
            name="dataType"
            value={item.key}
            checked={analyticFiltersForm.dataType === item.key}
            onChange={(e) =>
              handleChangeFilterObj("dataType", e.target.value)
            }
            className="accent-blue-600 w-4 h-4"
          />
          {item.name}
        </label>
      ))}
    </div>

    {/* Kat ve Birim */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Kat */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-600">Kat</label>
        <select
          value={analyticFiltersForm.section}
          onChange={(e) => handleChangeFilterObj("section", e.target.value)}
          className="w-full p-2.5 border rounded-lg text-sm"
        >
          <option value="all">Tüm Bölümler</option>
          {sectionData?.map((section, i) => (
            <option key={i} value={section.section}>
              {section.section}
            </option>
          ))}
        </select>
      </div>
      {/* Birim */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-600">Birim</label>
        <select
          value={analyticFiltersForm.areaName}
          onChange={(e) => handleChangeFilterObj("areaName", e.target.value)}
          className="w-full p-2.5 border rounded-lg text-sm"
        >
          <option value="all">Tüm Birimler</option>
          {areaData?.map((area, i) => (
            <option key={i} value={area.area_name}>
              {area.area_name}
            </option>
          ))}
        </select>
      </div>
    </div>

    {/* Proses & Makine */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Proses */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-600">Proses</label>
        <select
          value={analyticFiltersForm.prosess}
          onChange={(e) => handleChangeFilterObj("prosess", e.target.value)}
          className="w-full p-2.5 border rounded-lg text-sm"
          disabled={analyticFiltersForm.dataType === "measurement_data"}
        >
          <option value="all">Tüm Prosesler</option>
          {processData?.map((p, i) => (
            <option key={i} value={p.process_name}>
              {p.process_name}
            </option>
          ))}
        </select>
      </div>

      {/* Makine */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-600">Makine</label>
        <select
          value={analyticFiltersForm.machine}
          onChange={(e) => handleChangeFilterObj("machine", e.target.value)}
          className="w-full p-2.5 border rounded-lg text-sm"
          disabled={analyticFiltersForm.dataType === "measurement_data"}
        >
          <option value="">Tüm Makineler</option>
          {machineData?.map((m, i) => (
            <option key={i} value={m.machine_name}>
              {m.machine_name}
            </option>
          ))}
        </select>
      </div>
    </div>
    {analyticFiltersForm.dataType === "measurement_data" && (
      <p className="text-xs text-red-500 italic">
        Bu alan sadece "Sipariş Verisi" için geçerlidir. (Proses ve Makine)
      </p>
    )}

    {/* Tarih Aralığı */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-600">Başlangıç</label>
        <input
          type="date"
          value={analyticFiltersForm.startDate}
          onChange={(e) => handleChangeFilterObj("startDate", e.target.value)}
          className="w-full p-2.5 border rounded-lg text-sm"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-600">Bitiş</label>
        <input
          type="date"
          value={analyticFiltersForm.endDate}
          onChange={(e) => handleChangeFilterObj("endDate", e.target.value)}
          className="w-full p-2.5 border rounded-lg text-sm"
        />
      </div>
    </div>

    {/* Sipariş & Malzeme No */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-600">
          Sipariş No
        </label>
        <OrderMultiSelect/>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-600">
          Malzeme No
        </label>
        <input
          type="text"
          value={analyticFiltersForm.metarial_no}
          onChange={(e) =>
            handleChangeFilterObj("metarial_no", e.target.value)
          }
          className="w-full p-2.5 border rounded-lg text-sm"
          placeholder="#"
          disabled={analyticFiltersForm.dataType === "work_log"}
        />
         {analyticFiltersForm.dataType === "work_log" && (
      <p className="text-xs text-red-500 italic">
        Bu alan sadece "Ölçüm Verisi" için geçerlidir.
      </p>
    )}
      </div>
    </div>

    {/* Butonlar */}
    <div className="flex flex-col sm:flex-row gap-3">
      <Button
        onClick={handleFetchAllData}
        className="flex-1 bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 transition duration-200"
      >
        Filtrele
      </Button>
      <Button
        onClick={handleExportData}
        className="flex-1 bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 transition duration-200"
      >
        Dışarıya Veri Al
      </Button>
    </div>
  </div>
);

};

export default FilterPanel;
