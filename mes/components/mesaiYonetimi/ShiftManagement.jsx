"use client";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { toast } from "react-toastify";
import Button from "../ui/Button";
import {
  fetchShiftLogs,
  setSelectedShiftReport,
  setShiftReportPopup,
} from "@/redux/shiftSlice";
import { fetchAllUsers } from "@/redux/userSlice";
import ShiftTable from "./ShiftTable";
import { ShiftChart, WeeklyShiftTrendChart } from "./charts/ShiftChart";
import { usePathname } from "next/navigation";
import { setSelectionShift } from "@/redux/shiftSlice";
import Input from "../ui/Input";
import { useCallback } from "react";
let handleApproveShift;
let handleCancelShift;

const getApproveButtons = (selection_shift) => [
  {
    id: 1,
    onClick: () => handleApproveShift(selection_shift),
    children: "Onayla",
    type: "button",
    className: "w-[70%] py-2 bg-blue-500 hover:bg-blue-600",
  },
  {
    id: 3,
    onClick: () => handleCancelShift(selection_shift),
    children: "İptal",
    type: "button",
    className: "w-[70%] py-2 bg-red-500 hover:bg-red-600",
  },
];

//? Onay ekranı sayfa komponentı...
function ConfirmShift() {
  const { selection_shift } = useSelector((state) => state.shift);
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.user);
  useEffect(() => {
    dispatch(fetchAllUsers());
    dispatch(fetchShiftLogs());
  }, [dispatch]);

  //! Mesai kaydını onaylayacak istek
  handleApproveShift = async (rows) => {
    if (rows.length === 0) {
      toast.warning("İptal etmek ıstedıgınız mesai kaydını seçiniz.");
      return;
    }

    // some metounda eger belırtılen kostul saglanıyorsa true doner
    const hasShiftStatusThree = rows.some(
      (item) => item.shift_status === "Onay Bekliyor"
    );

    if (!hasShiftStatusThree) {
      toast.warning(
        "Seçtiginiz mesai kaydı onaylanmıs ya da seçilenler arasında onaylanmıs kayıtlar  var."
      );
      return; // Eğer bu koşula girerse, fonksiyon devam etmez.
    }

    const shiftIds = rows.map((item) => item.uniq_id);
    try {
      if (confirm("Mesai Kayıtları Onaylansın mı ?")) {
        const response = await axios.put(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/shift/approveShift`,
          {
            shift_uniq_id: shiftIds,
            approved_by: userInfo.id_dec,
          }
        );
        if (response.status === 200) {
          toast.success("Mesai kaydı başarıyla onaylandı.");
          dispatch(fetchShiftLogs());
          dispatch(setSelectionShift([]));
        } else if (response === 404) {
          toast.error("Böyle bir mesai kaydı bulunamadı");
        }
      }
    } catch (err) {
      console.log(err);
      toast.error(err?.response?.data || "x");
    }
  };
  //! Mesai kaydını ıptal edecek istek
  handleCancelShift = async (rows) => {
    if (rows.length === 0) {
      toast.warning("İptal etmek ıstedıgınız mesai kaydını seçiniz.");
      return;
    }

    // some metounda eger belırtılen kostul saglanıyorsa true doner
    const hasShiftStatusThree = rows.some(
      (item) => item.shift_status === "Onaylandı"
    );

    if (hasShiftStatusThree) {
      toast.warning("Mesai kaydı iptal edilemez, onaylanan kayıtlar mevcut.");
      return; // Eğer bu koşula girerse, fonksiyon devam etmez.
    }

    try {
      if (confirm("Mesai kaydı iptal edilsin mi ? ")) {
        const shiftIds = rows.map((item) => item.uniq_id);
        const response = await axios.put(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/shift/cancelShift`,
          {
            shift_uniq_id: shiftIds,
            cancelled_by: userInfo.id_dec,
          }
        );

        if (response.status === 200) {
          toast.success("Mesai kaydı basarıyla iptal edildi.");
          dispatch(fetchShiftLogs());
          dispatch(setSelectionShift([]));
        } else if (response === 400) {
          toast.error("Böyle bir mesai kaydı bulunamadı");
        }
      }
    } catch (err) {
      console.log(err);
      toast.error("Mesai iptal edilemedi sayfayı yenıleyıp tekrar deneyin.");
    }
  };
  console.log(selection_shift);
  return (
    <div className=" w-full">
      <div className="bg-white h-[600px] flex">
        <div className="w-[85%] h-full ml-1">
          <ShiftTable />
        </div>
        <div className="w-[15%] h-full ">
          <div className="w-full h-2/3 flex items-center justify-center flex-col gap-y-4 ">
            {getApproveButtons(selection_shift).map((item) => (
              <Button
                className={item.className}
                key={item.id}
                children={item.children}
                onClick={item.onClick}
              />
            ))}
          </div>
          <div className="w-full h-1/3 text-black font-semibold flex flex-col items-center">
            <div className="flex w-[100px] gap-x-3 items-center justify-between">
              <span className="w-4 h-4 bg-red-500 "> </span>
              <span>İptal</span>
            </div>
            <div className="flex w-[100px] gap-x-3 items-center justify-between">
              <span className="w-4 h-4 bg-green-500 "> </span>
              <span>Onaylı</span>
            </div>
            <div className="flex w-[100px] gap-x-3 items-center justify-between">
              <span className="w-4 h-4 bg-blue-500 "> </span>
              <span>Bekleyen</span>
            </div>
          </div>
        </div>
      </div>
      {/* chart */}
      <div className="w-full h-full flex justify-evenly items-center bg-white  ">
        <div className="">
          <h1 className="text-black font-semibold mt-2">
            Katlara Göre Günlük Mesai Sayısı
          </h1>
          <ShiftChart />
        </div>
        <div className="">
          {" "}
          <WeeklyShiftTrendChart />{" "}
        </div>
      </div>
    </div>
  );
}

//? idari işler sayfa komponentı...
function IdariIsler() {
  const pathName = usePathname();
  const create_shift_name = pathName.split("/")[3];
  const { selection_shift, usersOnShifts, selectedShiftReport } = useSelector(
    (state) => state.shift
  );
  const { userInfo } = useSelector((state) => state.user);
  const [vehicleType, setVehicleType] = useState("servis");
  const times = ["Akşam Servis Saati", "12:00", "12:30", "13:00"];
  const [vasıtaForm, setVasıtaForm] = useState({
    driver_name: "",
    driver_no: "",
    vehicle_licance: "",
    station_name: "",
    service_time: "12:00",
    evening_service_time: times[0],
    morning_service_hours: "",
    vehicle: "",
  });
  const vehicles = [
    {
      name: "Taksi 1",
      group: "taksi",
    },
    {
      name: "Taksi 2",
      group: "taksi",
    },
    {
      name: "Taksi 3",
      group: "taksi",
    },
    {
      name: "Taksi 4",
      group: "taksi",
    },
    {
      name: "Taksi 5",
      group: "taksi",
    },
    {
      name: "Taksi 6",
      group: "taksi",
    },
    {
      name: "Servis 1",
      group: "servis",
    },
    {
      name: "Servis 2",
      group: "servis",
    },
    {
      name: "Servis 3",
      group: "servis",
    },
    {
      name: "Servis 4",
      group: "servis",
    },
    {
      name: "Servis 5",
      group: "servis",
    },
    {
      name: "Servis 6",
      group: "servis",
    },
  ];

  const vasıtInputField = [
    {
      name: "driver_name",
      type: "text",
      placeholder: "Şöför Adı",
      className: `h-[4rem]`,
    },
    {
      name: "driver_no",
      type: "text",
      placeholder: "Şöför Tel No",
      className: `h-[4rem]`,
    },
    {
      name: "vehicle_licance",
      type: "text",
      placeholder: "Araç Plaka No",
      className: `h-[4rem]`,
    },
    {
      name: "station_name",
      type: "text",
      placeholder: "Durak Adı",
      className: `h-[4rem]`,
    },
    {
      name: "service_time",
      type: "time", // Zaman seçimi için doğru tip
      placeholder: "Servis Gelme Saati",
      className: `h-[4rem]`,
    },
  ];
  const dispatch = useDispatch();
  const filteredVehicle = vehicles.filter((item) => item.group === vehicleType);

  // Ortak handleChange fonksiyonu
  const handleChange = useCallback(({ name, value }) => {
    setVasıtaForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const groupedData = usersOnShifts.reduce((acc, curr) => {
    const {
      service_key,
      vehicle,
      station_name,
      shift_uniq_id,
      start_date,
      driver_name,
      driver_no,
      evening_service_time,
      morning_service_time,
      service_time,
      vehicle_plate_no,
      shift_status
    } = curr;

    // Eğer service_key eksikse bu kaydı atla
    if (!service_key) {
      return acc;
    }

    // Grup anahtarı artık doğrudan service_key
    const groupKey = service_key;

    // Eğer bu grup daha önce oluşturulmadıysa, yeni bir grup oluştur
    if (!acc[groupKey]) {
      acc[groupKey] = {
        service_key,
        vehicle,
        station_names: new Set(), // Durak isimlerini benzersiz saklamak için Set
        user_count: 0,
        shiftIds: [],
        start_date,
        driver_name,
        driver_no,
        evening_service_time,
        morning_service_time,
        service_time,
        vehicle_plate_no,
        shift_status
        
      };
    }

    // Durak ismini ekle
    acc[groupKey].station_names.add(station_name);

    // Kullanıcı sayısını artır
    acc[groupKey].user_count++;

    // Shift ID'yi ekle
    if (shift_uniq_id) {
      acc[groupKey].shiftIds.push(shift_uniq_id);
    }

    return acc;
  }, {});

  // Sonuçları formatla
  const result = Object.values(groupedData).map((data) => ({
    service_key: data.service_key,
    vehicle: data.vehicle,
    station_names: Array.from(data.station_names), // Set'ten diziye çevir
    user_count: data.user_count,
    shiftIds: data.shiftIds,
    start_date: data.start_date,
    service_time: data.service_time,
    start_date: data.start_date,
    driver_name: data.driver_name,
    driver_no: data.driver_no,
    evening_service_time: data.evening_service_time,
    morning_service_time: data.morning_service_time,
    vehicle_plate_no: data.vehicle_plate_no,
    shift_status:data.shift_status
  }));

  //! mesai kaydına servıs bılgılerını ekleyecek fonksıyon...
  const handleAddVehicleInfo = async () => {
    if (!vasıtaForm.vehicle) {
      toast.error("Vasıta bılgılerını eklemek ıcın vasıta seçimi yapın");
      return;
    }
    if (selection_shift.length === 0) {
      toast.error("Vasıta bilgilerini gireceğiniz mesai kayıtlarını seçiniz.");
      return;
    }

    // kayıtların unıq ıdsını bır dızıde tut.
    const shiftUnıqIds = selection_shift.map((item) => item.id);
    const isApproved = selection_shift.some(
      (item) => item.shift_status !== "Onaylandı"
    );

    if (isApproved) {
      toast.error("İşleme devam etmek için sadec onaylı kayıtları seçin.");
      return;
    }

    const isUseVehicle = result?.some(
      (item) => item.vehicle === vasıtaForm.vehicle
    );
    if (isUseVehicle) {
      toast.error(`${vasıtaForm.vehicle} kullanılıyor`);
      return;
    }
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/shift/addVehicleInfo`,
        {
          shiftUnıqIds,
          vasıtaForm,
        }
      );
      if (response.status === 200) {
        toast.success("Vasıta bilgileri başarıyla güncellendi.");
        dispatch(fetchShiftLogs());
        dispatch(setSelectionShift([]));
        setVasıtaForm({
          driver_name: "",
          driver_no: "",
          vehicle_licance: "",
          station_name: "",
          service_time: "12:00",
          evening_service_time: times[0],
          morning_service_time: "",
        });
      }
    } catch (err) {
      console.log(err);
    }
  };

  //! Mesai kaydını ıptal edecek istek
  handleCancelShift = async (rows) => {
    if (rows.length === 0) {
      toast.warning("İptal etmek ıstedıgınız mesai kaydını seçiniz.");
      return;
    }

    // some metounda eger belırtılen kostul saglanıyorsa true doner
    const hasShiftStatusThree = rows.some(
      (item) => item.shift_status === "Onaylandı"
    );

    if (hasShiftStatusThree && create_shift_name !== "idariisler") {
      toast.warning("Mesai kaydı iptal edilemez, onaylanan kayıtlar mevcut.");
      return; // Eğer bu koşula girerse, fonksiyon devam etmez.
    }

    try {
      if (confirm("Mesai kaydı iptal edilsin mi ? ")) {
        const shiftIds = rows.map((item) => item.uniq_id);
        const response = await axios.put(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/shift/cancelShift`,
          {
            shift_uniq_id: shiftIds,
            cancelled_by: userInfo.id_dec,
          }
        );

        if (response.status === 200) {
          toast.success("Mesai kaydı basarıyla iptal edildi.");
          dispatch(fetchShiftLogs());
          dispatch(setSelectionShift([]));
        } else if (response === 400) {
          toast.error("Böyle bir mesai kaydı bulunamadı");
        }
      }
    } catch (err) {
      console.log(err);
      toast.error("Mesai iptal edilemedi sayfayı yenıleyıp tekrar deneyin.");
    }
  };

  useEffect(() => {
    dispatch(fetchAllUsers());
    dispatch(fetchShiftLogs());
  }, [dispatch]);

  // servıs atananlar tablosundan satır sececek fonksıyon...
  const handleSelectedRow = (row) => {
    const currentSelectedShiftReport = [...selectedShiftReport];
    // Eğer zaten seçiliyse, seçimi kaldır
    if (
      currentSelectedShiftReport
        .map((item) => item.service_key)
        .includes(row.service_key)
    ) {
      const updatedSelection = currentSelectedShiftReport.filter(
        (item) => item.service_key !== row.service_key
      );

      dispatch(setSelectedShiftReport(updatedSelection));

      // Eğer seçim sıfırsa veya birden fazlaysa formu sıfırla
      if (updatedSelection.length !== 1) {
        setVasıtaForm({
          driver_name: "",
          driver_no: "",
          vehicle_licance: "",
          station_name: "",
          service_time: "12:00",
          evening_service_time: times[0],
          morning_service_hours: "",
          vehicle: "",
        });
      } else {
        // Eğer seçim 1'e düştüyse formu doldur
        setVasıtaForm({
          driver_name: updatedSelection[0].driver_name || "",
          driver_no: updatedSelection[0].driver_no || "",
          vehicle_licance: updatedSelection[0].vehicle_plate_no || "",
          station_name: updatedSelection[0].station_name[0] || "",
          service_time: updatedSelection[0].service_time || "12:00",
          evening_service_time:
            updatedSelection[0].evening_service_time || times[0],
          morning_service_hours: updatedSelection[0].morning_service_time || "",
          vehicle: updatedSelection[0].vehicle || "",
        });
      }
    } else {
      // Eğer seçim yapılıyorsa, ekle
      const updatedSelection = [...currentSelectedShiftReport, row];
      dispatch(setSelectedShiftReport(updatedSelection));

      // Eğer seçim 1 olduysa formu doldur
      if (updatedSelection.length === 1) {
        const selected = updatedSelection[0]; // Seçili eleman

        setVasıtaForm({
          driver_name: selected.driver_name || "", // Null kontrolü
          driver_no: selected.driver_no || "",
          vehicle_licance: selected.vehicle_plate_no || "", // Eğer `vehicle_plate_no` yoksa kontrol edin
          station_name: selected.station_names[0] || "", // Array kontrolü
          service_time: selected.service_time || "12:00",
          evening_service_time: selected.evening_service_time || times[0],
          morning_service_hours: selected.morning_service_time || "",
          vehicle: selected.vehicle || "",
        });
      } else {
        // Eğer seçim birden fazlaysa formu sıfırla
        setVasıtaForm({
          driver_name: "",
          driver_no: "",
          vehicle_licance: "",
          station_name: "",
          service_time: "12:00",
          evening_service_time: times[0],
          morning_service_hours: "",
          vehicle: "",
        });
      }
    }
  };

  // servıs raporu popup ını acacak fonkssıyon
  const handleOpenReportPopup = () => {
    dispatch(setShiftReportPopup(true));
  };

  //! Servis bilgilerini güncelleyecek fonksiyon...
  const handleUpdatedService = async () => {
    try {
      if (selectedShiftReport.length !== 1) {
        toast.error("Güncelleme yapmak için sadece bir servis seçiniz.");
        return;
      }
      if (confirm("Servis bilgileri güncellensin mi ?")) {
        const response = await axios.put(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/shift/updatedVehicleInfo`,
          { vasıtaForm, service_key: selectedShiftReport[0].service_key }
        );

        if (response.status === 200) {
          toast.success("Servis bilgileri başarıyla güncellendi.");
          dispatch(fetchShiftLogs());
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  //! Seçili kayıtları belirli bir servise atayacak query...
  const handleAddUserToService = async () => {
    if (selectedShiftReport.length !== 1) {
      toast.error("Kayıtları taşıyacağınız sadece 1 servis seçin");
      return;
    }
    if (selection_shift.length === 0) {
      toast.error("Servise taşıyacağınız kullanıcıları seçin.");
      return;
    }
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/shift/addUserToService`,
        {
          selection_shift: selection_shift,
          selectedShiftReport: selectedShiftReport[0],
        }
      );

      if (response.status === 200) {
        // Backend'den dönen mesajı kontrol et
        toast.success(response.data.message || "Ekleme işlemi başarılı.");
        dispatch(fetchShiftLogs());
        dispatch(setSelectionShift([]));
        dispatch(setSelectedShiftReport([]));
        setVasıtaForm({
          driver_name: "",
          driver_no: "",
          vehicle_licance: "",
          station_name: "",
          service_time: "12:00",
          evening_service_time: times[0],
          morning_service_time: "",
        });
      } else {
        toast.error("Bir hata oluştu.");
      }
    } catch (err) {
      console.log(err);
      const errorMessage = err.response?.data?.message || "Bir hata oluştu.";
      toast.error(errorMessage);
    }
  };
  console.log(selection_shift, selectedShiftReport);
  // secılen kullanıcıyı ıptal edecek fonksıyon...
  const cancelSelectingShift = (item) => {
    dispatch(
      setSelectionShift(
        selection_shift.filter((selectedRow) => selectedRow.id !== item.id)
      )
    );
  };
  return (
    <div className=" w-full ">
      <div className="h-[600px] flex">
        <div className="w-[85%] h-full ml-1">
          <ShiftTable />
        </div>
        <div className="w-[15%] h-full  ">
          <div className="w-full h-2/3 flex items-center justify-center flex-col gap-y-4 ">
            <Button
              children={"İptal"}
              onClick={() => handleCancelShift(selection_shift)}
              type="button"
              className="w-[70%] py-2 bg-red-500 hover:bg-red-600"
            />
            <Button
              children={"Ekle"}
              onClick={handleAddUserToService}
              type="button"
              className="w-[70%] py-2 bg-blue-500 hover:bg-blue-600"
            />
          </div>
          <div className="w-full h-1/3 text-black font-semibold flex flex-col items-center">
            <div className="flex w-[100px] gap-x-3 items-center justify-between">
              <span className="w-4 h-4 bg-red-500 "> </span>
              <span>İptal</span>
            </div>
            <div className="flex w-[100px] gap-x-3 items-center justify-between">
              <span className="w-4 h-4 bg-green-500 "> </span>
              <span>Onaylı</span>
            </div>
            <div className="flex w-[100px] gap-x-3 items-center justify-between">
              <span className="w-4 h-4 bg-blue-500 "> </span>
              <span>Bekleyen</span>
            </div>
          </div>
        </div>
      </div>
      {/* chart */}
      <div className="w-full h-full flex justify-evenly items-center gap-x-1   text-black">
        {/* 1 */}
        <div className="w-1/3 h-[400px]  flex gap-x-1">
          {/* seçilen kullanıcılar */}
          <div className="w-1/2 h-full ">
            <h1 className="font-semibold underline text-center w-full py-3 tracking-widest bg-[#A6AEBF]">
              Seçilen Operatörler
            </h1>
            <div className="flex flex-col h-[350px] overflow-y-auto ">
              {selection_shift &&
                selection_shift.map((item, index) => (
                  <div
                    key={index}
                    className="flex hover:bg-[#D0E8C5] cursor-pointer justify-between px-4 py-3 font-semibold shadow-lg"
                  >
                    <span>{item.name}</span>
                    <button onClick={() => cancelSelectingShift(item)}>
                      X
                    </button>
                  </div>
                ))}
            </div>
          </div>
          {/* vasıta seç */}
          <div className="w-1/2 h-full ">
            <div className="font-semibold underline text-center w-full tracking-widest bg-slate-300">
              <button
                onClick={() => setVehicleType("servis")}
                className={`w-1/2 h-full py-3 text-center hover:bg-slate-400 ${
                  vehicleType === "servis"
                    ? "bg-green-600 hover:bg-green-600"
                    : "bg-slate-400"
                }`}
              >
                Servis
              </button>
              <button
                onClick={() => setVehicleType("taksi")}
                className={`w-1/2 h-full py-3 text-center hover:bg-slate-400 ${
                  vehicleType === "taksi"
                    ? "bg-green-600 hover:bg-green-600"
                    : "bg-slate-400"
                }`}
              >
                Taksi
              </button>
            </div>
            <div className="flex flex-col overflow-y-scroll h-[350px]">
              {filteredVehicle.map((item, index) => (
                <span
                  key={index}
                  onClick={() =>
                    handleChange({ name: "vehicle", value: item.name })
                  }
                  className={` ${
                    item.name === vasıtaForm["vehicle"]
                      ? "flex px-4 py-3 font-semibold shadow-sm border bg-[#D0E8C5] cursor-pointer"
                      : "flex px-4 py-3 font-semibold shadow-sm cursor-pointer border bg-[#C5D3E8]"
                  }`}
                >
                  {item.name}
                </span>
              ))}
            </div>
          </div>
        </div>
        {/* 2 */}
        <div className="w-1/3 h-[400px] flex gap-x-1 ">
          {/* vasıta bılgı formu */}
          <div className="w-1/2">
            <h1 className="font-semibold underline text-center w-full py-3 tracking-widest bg-[#A6AEBF]">
              Vasıta Bilgi Formu
            </h1>
            <div className="w-full flex flex-col  gap-y-[5px]">
              {vasıtInputField.map((item, index) => (
                <Input
                  key={index}
                  name={item.name}
                  placeholder={item.placeholder}
                  addProps={item.className}
                  type={item.type}
                  value={vasıtaForm[item.name]} // Seçili verilerle doldurulan değer
                  onChange={(e) =>
                    handleChange({ name: item.name, value: e.target.value })
                  }
                />
              ))}
            </div>
          </div>
          {/* saat sec */}
          <div className="w-1/2">
            <h1 className="font-semibold underline text-center w-full py-3  bg-[#A6AEBF]">
              Servis Saati
            </h1>
            <div className="flex flex-col gap-y-1">
              <Input
                name="morning_service_hours"
                placeholder={"Sabah Servis Saati"}
                type={"time"}
                addProps={"h-[4rem]"}
                value={vasıtaForm.morning_service_hours}
                onChange={(e) =>
                  handleChange({
                    name: "morning_service_hours",
                    value: e.target.value,
                  })
                }
              />

              <select
                name="evening_service_time"
                className="h-[4rem] w-full border-secondary border"
                value={vasıtaForm.evening_service_time}
                onChange={(e) =>
                  handleChange({
                    name: "evening_service_time",
                    value: e.target.value,
                  })
                }
              >
                {times.map((item, index) => (
                  <option key={index} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full flex flex-col justify-center gap-y-4 mt-1">
              <Button
                onClick={handleAddVehicleInfo}
                children={"Vasıta Bilgilerini Ekle"}
              />
              <Button
                onClick={handleUpdatedService}
                children={"Vasıta Bilgileri Güncelle"}
              />
              <Button
                onClick={handleOpenReportPopup}
                children={"Servis Raporu"}
              />
              <div></div>
            </div>
          </div>
        </div>
        {/* 3 servis raporu tablosu... */}
        <div className="w-1/3 h-[400px] overflow-y-auto border-secondary border">
          <table className="w-full border-collapse border border-slate-400 ">
            <thead className="bg-[#A6AEBF] text-center">
              <tr>
                <th className="py-3 font-semibold underline border border-slate-400 ">
                  Araç
                </th>
                <th className="py-3 font-semibold underline border border-slate-400 ">
                  Durak Adı
                </th>
                <th className="py-3 font-semibold underline border border-slate-400 ">
                  Kişi Sayısı
                </th>
              </tr>
            </thead>
            <tbody className="">
              {result.map((item, index) => (
                <tr
                  key={item.service_key} // Benzersiz key için service_key kullanılıyor
                  className={`w-full cursor-pointer ${
                    selectedShiftReport
                      ?.map((report) => report.service_key) // Diziden service_key'leri alıyoruz
                      ?.includes(item.service_key)
                      ? "bg-[#D0E8C5]" // Seçili satırın arka plan rengi
                      : index % 2 === 0
                      ? "bg-[#C5D3E8]" // Varsayılan arka plan rengi
                      : "bg-[#C5D3E8]"
                  } hover:bg-gray-200`}
                  style={{ height: "50px" }}
                  onClick={() => handleSelectedRow(item)} // Satır seçme fonksiyonunu çağır
                >
                  <td className="text-center border border-slate-400 ">
                    {item.vehicle}
                  </td>
                  <td className="text-center border border-slate-400 ">
                    {item.station_names[0]}
                  </td>
                  <td className="text-center border border-slate-400 ">
                    {item.user_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CreateShift() {
  const dispatch = useDispatch();
  const [user, setUser] = useState(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const { userInfo, allUser } = useSelector((state) => state.user);
  const { selection_shift } = useSelector((state) => state.shift);
  const pathName = usePathname();
  const create_shift_name = pathName.split("/")[3];
  const [selectionModel, setSelectionModel] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [formData, setFormData] = useState({
    kullanici: "",
    baslangicTarihi: "",
    donusTarihi: "",
    baslangicSaati: "",
    bitisSaati: "",
  });

  useEffect(() => {
    dispatch(fetchAllUsers());
    dispatch(fetchShiftLogs());
  }, [dispatch]);

  //! Girilen id ile kullanıcı bılgılerını cekcek query
  const handleSearchUser = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/${selectedUser.id_dec}/getuserinfo`
      );
      if (response.status === 200) {
        setUser(response.data);
        toast.success("Kullanıcı bilgileri başarıyla çekildi.");
      }
    } catch (err) {
      console.log(err);
      toast.error("Kullanıcı bilgileri çekilemedi. (Yanlış ID)");
      setUser(null);
    }
  };

  // Kullanıcı arama input'unda ve dropdown'larda değişiklik olduğunda form verisini günceller
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Eğer kullanıcı arama alanı ise filtreleme yap
    if (name === "kullanici") {
      if (value.trim() !== "") {
        const filtered = allUser?.filter((item) =>
          item.op_username.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredUsers(filtered);
        setDropdownVisible(true);
      } else {
        setFilteredUsers([]);
        setDropdownVisible(false);
      }
    }
  };

  // Kullanıcı seçildiğinde çalışacak fonksiyon
  const handleSelectedUser = (user) => {
    setSelectedUser(user);
    setFormData({ ...formData, kullanici: user.op_username });

    // Dropdown'u kapat ama input'taki değeri silme
    setFilteredUsers([]);
    setDropdownVisible(false);
  };

  const times = [
    "22:00",
    "23:00",
    "01:00",
    "Sabahlama",
    "21:00",
    "Vardiya 1 (19:00)",
  ];

  //! Mesai kaydını ıptal edecek istek
  handleCancelShift = async (rows) => {
    if (rows.length === 0) {
      toast.warning("İptal etmek ıstedıgınız mesai kaydını seçiniz.");
      return;
    }

    // some metounda eger belırtılen kostul saglanıyorsa true doner
    const hasShiftStatusThree = rows.some(
      (item) => item.shift_status === "Onaylandı"
    );

    if (hasShiftStatusThree) {
      toast.warning("Mesai kaydı iptal edilemez, onaylanan kayıtlar mevcut.");
      return; // Eğer bu koşula girerse, fonksiyon devam etmez.
    }

    try {
      if (confirm("Mesai kaydı iptal edilsin mi ? ")) {
        const shiftIds = rows.map((item) => item.uniq_id);
        const response = await axios.put(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/shift/cancelShift`,
          {
            shift_uniq_id: shiftIds,
            cancelled_by: userInfo.id_dec,
          }
        );

        if (response.status === 200) {
          toast.success("Mesai kaydı basarıyla iptal edildi.");
          dispatch(fetchShiftLogs());
          dispatch(setSelectionShift([]));
        } else if (response === 400) {
          toast.error("Böyle bir mesai kaydı bulunamadı");
        }
      }
    } catch (err) {
      console.log(err);
      toast.error("Mesai iptal edilemedi sayfayı yenıleyıp tekrar deneyin.");
    }
  };
  //! Mesai kaydını onaylayacak istek
  handleApproveShift = async (rows) => {
    const shiftIds = rows.map((item) => item.uniq_id);
    try {
      if (confirm("Mesai Kayıtları Onaylansın mı ?")) {
        const response = await axios.put(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/shift/approveShift`,
          {
            shift_uniq_id: shiftIds,
            approved_by: userInfo.id_dec,
          }
        );
        if (response.status === 200) {
          toast.success("Mesai kaydı başarıyla onaylandı.");
          dispatch(fetchShiftLogs());
          dispatch(setSelectionShift([]));
        } else if (response === 404) {
          toast.error("Böyle bir mesai kaydı bulunamadı");
        }
      }
    } catch (err) {
      console.log(err);
      toast.error(err.response.data);
    }
  };

  //! Mesai olustaracak query...
  const handleCreateShıft = async () => {
    try {
      if (
        !formData.baslangicSaati ||
        !formData.baslangicTarihi ||
        !formData.bitisSaati ||
        !formData.donusTarihi
      ) {
        toast.error("Başlangıç ve bitiş tarihlerini giriniz.");
        return;
      }
      if (!user) {
        toast.error(
          "Mesai olusturacagınız kullanıcıyı seçip personel ara butonuna tıklayın."
        );
      }
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/shift/createShift`,
        {
          operator_id: user.id_dec,
          created_by: userInfo.id_dec,
          start_date: formData.baslangicTarihi,
          end_date: formData.donusTarihi,
          start_time: formData.baslangicSaati,
          end_time: formData.bitisSaati,
          route: user.route,
          stop_name: user.stop_name,
          address: user.address,
        }
      );
      if (response.status === 200) {
        toast.success(`${formData.kullanici} için mesai onaya gönderildi.`);
        setFormData({
          kullanici: "",
          baslangicTarihi: "",
          donusTarihi: "",
          baslangicSaati: "",
          bitisSaati: "",
        });
        setUser(null);
        dispatch(fetchShiftLogs());
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-y-2">
      {/* form komponent... */}
      <div className="w-auto h-1/4 rounded-md  flex  justify-center text-black bg-white p-1  ">
        {/* 1 */}
        <div className="w-[30%] ">
          <div className="flex w-full justify-evenly items-center">
            <div className="relative">
              <label className="block mb-2 font-semibold underline">
                Kullanıcı İsmi
              </label>
              <input
                type="text"
                name="kullanici"
                className="w-full p-2 border rounded-md"
                required
                value={formData.kullanici}
                onChange={handleInputChange}
              />
              {dropdownVisible &&
                filteredUsers.length > 0 &&
                formData.kullanici.length > 0 && (
                  <div className="max-h-[300px] absolute z-50 p-2 overflow-y-scroll left-0 right-0 shadow-xl bg-white transition-all duration-200 ">
                    {filteredUsers.map((item, index) => (
                      <div
                        key={index}
                        onClick={() => handleSelectedUser(item)}
                        className="text-black py-1 flex gap-x-5 border-b hover:text-white hover:font-semibold hover:bg-slate-500 cursor-pointer hover:p-2"
                      >
                        <span className="w-2 font-semibold">{index + 1}-</span>
                        <span className="w-24">{item.id_dec}</span>
                        <span>{item.op_username}</span>
                      </div>
                    ))}
                  </div>
                )}
            </div>
            <div className="flex flex-col">
              <span className="block mb-2 font-semibold underline">
                Kullanıcı Bilgilerini Al
              </span>
              <button
                type="button"
                onClick={handleSearchUser}
                className="p-2 bg-slate-600 hover:bg-slate-400 transition-all rounded-md text-white"
              >
                Personel Ara
              </button>
            </div>
          </div>
          {user && (
            <div className="flex justify-evenly  mt-10 w-full">
              <div>
                <span className="font-semibold">Personel Ad:</span>
                <span className="p-2">{user?.op_username}</span>
              </div>
              <div>
                <span className="font-semibold">Personel ID:</span>
                <span className="p-2">{user?.id_dec}</span>
              </div>
            </div>
          )}
        </div>
        <div className="w-[30%] px-1 ">
          <div>
            <label className="block mb-4 font-semibold underline">
              Mesai Başlangıç Tarihi:
            </label>
            <input
              type="date"
              name="baslangicTarihi"
              className="w-full p-2 border rounded-md"
              required
              onChange={handleInputChange}
              value={formData.baslangicTarihi}
            />
          </div>
          <div>
            <label className="block mb-4 font-semibold underline">
              Mesai Bitiş Tarihi:
            </label>
            <input
              type="date"
              name="donusTarihi"
              className="w-full p-2 border rounded-md"
              required
              onChange={handleInputChange}
              value={formData.donusTarihi}
            />
          </div>
        </div>
        <div className="w-[30%] px-1 ">
          <div>
            <label className="block mb-4 font-semibold underline">
              Mesai Başlangıç Saati
            </label>
            <select
              name="baslangicSaati"
              className="w-full p-2 border rounded-md"
              required
              onChange={handleInputChange}
              value={formData.baslangicSaati || ""}
            >
              <option value="">Başlangıç saati seçin</option>
              {times.map((time, index) => (
                <option key={index} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-4 font-semibold underline">
              Mesai Bitiş Saati
            </label>
            <select
              name="bitisSaati"
              className="w-full p-2 border rounded-md"
              required
              onChange={handleInputChange}
              value={formData.bitisSaati || ""}
            >
              <option value="">Bitiş saati seçin</option>
              {times.map((time, index) => (
                <option key={index} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="w-[10%]  flex flex-col gap-y-3 justify-center items-center">
          <Button
            className=" bg-green-500 hover:bg-green-500"
            children="Oluştur"
            onClick={handleCreateShıft}
          />
          <Button
            className=" bg-red-500 hover:bg-red-500"
            children="İptal"
            onClick={() => handleCancelShift(selection_shift)}
          />
        </div>
      </div>
      {/* table */}
      <div className="h-3/4 w-auto sm:w-full  bg-white rounded-md flex">
        <div className="w-2/3 h-full">
          <ShiftTable />
        </div>
        {/* charts */}
        <div className="w-1/3 h-full flex  flex-col justify-center items-center ">
          <div className="h-1/2 flex justify-center items-end">
            {" "}
            <ShiftChart />
          </div>
          <div className="h-1/2 flex justify-center items-center">
            <WeeklyShiftTrendChart />{" "}
          </div>
        </div>
      </div>
    </div>
  );
}

function ShiftManagement() {
  const pathName = usePathname();
  const create_shift_name = pathName.split("/")[3];

  return (
    <>
      {create_shift_name === "mesaiolustur" && (
        <div className="w-full h-full">
          <CreateShift />
        </div>
      )}
      {create_shift_name === "mesaionayla" && (
        <div>
          <ConfirmShift />
        </div>
      )}
      {create_shift_name === "idariisler" && (
        <div className="">
          <IdariIsler />
        </div>
      )}
    </>
  );
}

export default ShiftManagement;
