"use client";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { toast } from "react-toastify";
import Button from "../ui/Button";
import TabButtons from "../izinYonetimSistemi/parts/TabButtons";
import {
  fetchShiftLogs,
  setSelectedShiftReport,
  setShiftReportPopup,
} from "@/redux/shiftSlice";
import { fetchAllUsers } from "@/redux/userSlice";
import ShiftTable from "./ShiftTable";
import UserTable from "./UserTable";
import { ShiftChart, WeeklyShiftTrendChart } from "./charts/ShiftChart";
import { usePathname } from "next/navigation";
import { setSelectionShift, setSelectedShiftUser } from "@/redux/shiftSlice";
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
  // selectedTab stateını tabButtons a yollayacagız...
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
          <div className="h-[10%] w-full">
            {/* <TabButtons
              tab={selectedTab}
              setTab={setSelectedTab}
              buttons={[
                { id: "all", label: "Tüm Mesailer" },
                { id: "pending", label: "Onay Bekleyen" },
                { id: "approved", label: "Onaylanan" },
                { id: "cancelled", label: "İptal Edilen" },
              ]}
            /> */}
          </div>
          <div className="h-[90%]">
            <ShiftTable />
          </div>
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
            <div className="flex w-[150px] gap-x-3 items-center justify-between">
              <span className="w-4 h-4 bg-red-500 "> </span>
              <span>İptal</span>
            </div>
            <div className="flex w-[150px] gap-x-3 items-center justify-between">
              <span className="w-4 h-4 bg-green-500 "> </span>
              <span>Onaylandı</span>
            </div>
            <div className="flex w-[150px] gap-x-3 items-center justify-between">
              <span className="w-4 h-4 bg-blue-500 "> </span>
              <span>Onay Bekliyor</span>
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
  const [vasıtaForm, setVasıtaForm] = useState({
    driver_name: "",
    driver_no: "",
    vehicle_licance: "",
    station_name: "",
    service_time: "", // servisin gelme saati...
    service_period: "",
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
      disabled: !!selection_shift,
    },
    {
      name: "service_time",
      type: "time", // Zaman seçimi için doğru tip
      placeholder: "Servis Gelme Saati",
      className: `h-[4rem]`,
      disabled: !!selection_shift,
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
      service_time,
      vehicle_plate_no,
      shift_status,
      service_period,
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
        service_time,
        vehicle_plate_no,
        shift_status,
        service_period,
        service_time,
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
    vehicle_plate_no: data.vehicle_plate_no,
    shift_status: data.shift_status,
    service_period: data.service_period,
    service_time: data.service_time,
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
    if (!vasıtaForm.service_period) {
      toast.error("Servisin 'Aksam' yada 'Sabah' olacagını seçiniz");
      return;
    }

    if (
      !vasıtaForm.driver_name ||
      !vasıtaForm.driver_no ||
      !vasıtaForm.vehicle_licance
    ) {
      toast.error("Sürücü bilgilerini giriniz.");
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
          service_time: "",
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
          service_time: "",
          vehicle: "",
          service_period: "",
        });
      } else {
        // Eğer seçim 1'e düştüyse formu doldur
        setVasıtaForm({
          driver_name: updatedSelection[0].driver_name || "",
          driver_no: updatedSelection[0].driver_no || "",
          vehicle_licance: updatedSelection[0].vehicle_plate_no || "",
          station_name: updatedSelection[0].station_name[0] || "",
          service_time: updatedSelection[0].service_time || "",
          vehicle: updatedSelection[0].vehicle || "",
          service_period: updatedSelection[0].service_period || "",
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
          service_time: selected.service_time || "",
          vehicle: selected.vehicle || "",
          service_period: selected.service_period || "",
        });
      } else {
        // Eğer seçim birden fazlaysa formu sıfırla
        setVasıtaForm({
          driver_name: "",
          driver_no: "",
          vehicle_licance: "",
          station_name: "",
          service_time: "",
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

    // `shift_status` "Onaylandı" olmayan kullanıcıları kontrol et
    const selectionApproved = selection_shift.find((item) => {
      return item.shift_status !== "Onaylandı";
    });

    if (selectionApproved) {
      toast.error(
        "Seçtiğiniz kullanıcılar arasında servıse atanmıs olanlar var. Sadece atanmamış kişileri ekleyebilirsiniz."
      );
      return;
    }
    if (!vasıtaForm.station_name) {
      toast.error(
        `${selectedShiftReport[0].vehicle}'e ekleyeceğiniz kayıtlar için durak ismi giriniz`
      );
      return;
    }
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/shift/addUserToService`,
        {
          selection_shift: selection_shift,
          selectedShiftReport: selectedShiftReport[0],
          vasıtaForm,
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
          service_time: "",
          service_period: "",
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
                  disabled={item.disabled}
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
              {/* checkboxlar  */}
              <div className="flex justify-center py-2 gap-x-2">
                {/* Sabah Servisi */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="morning_service"
                    name="service_period"
                    value="Sabah"
                    checked={vasıtaForm.service_period === "Sabah"}
                    onChange={(e) => {
                      handleChange({
                        name: "service_period",
                        value: e.target.checked ? "Sabah" : "",
                      });
                      if (e.target.checked) {
                        document.getElementById(
                          "evening_service"
                        ).checked = false; // Akşam servis seçimini kaldır
                      }
                    }}
                    className="mr-2"
                  />
                  <label
                    htmlFor="morning_service"
                    className="text-sm font-semibold"
                  >
                    Sabah Servisi
                  </label>
                </div>

                {/* Akşam Servisi */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="evening_service"
                    name="service_period"
                    value="Aksam"
                    checked={vasıtaForm.service_period === "Aksam"}
                    onChange={(e) => {
                      handleChange({
                        name: "service_period",
                        value: e.target.checked ? "Aksam" : "",
                      });
                      if (e.target.checked) {
                        document.getElementById(
                          "morning_service"
                        ).checked = false; // Sabah servis seçimini kaldır
                      }
                    }}
                    className="mr-2"
                  />
                  <label
                    htmlFor="evening_service"
                    className="text-sm font-semibold"
                  >
                    Akşam Servisi
                  </label>
                </div>
              </div>
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
//? mesai olusturma sayfa komponentı...
function CreateShift() {
  const dispatch = useDispatch();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const { userInfo, allUser } = useSelector((state) => state.user);
  const { selection_shift, selectedShiftUser, usersOnShifts } = useSelector(
    (state) => state.shift
  );
  const pathName = usePathname();
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
      if (selectedShiftUser.length === 0 || !selectedShiftUser) {
        toast.error(
          "Mesai olusturacagınız kullanıcıları soldaki listeden seçiniz."
        );
      }
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/shift/createShift`,
        {
          created_by: userInfo.id_dec,
          start_date: formData.baslangicTarihi,
          end_date: formData.donusTarihi,
          start_time: formData.baslangicSaati,
          end_time: formData.bitisSaati,
          selectedShiftUser,
        }
      );
      if (response.status === 200) {
        toast.success(`${response.data.message}`);
        setFormData({
          kullanici: "",
          baslangicTarihi: "",
          donusTarihi: "",
          baslangicSaati: "",
          bitisSaati: "",
        });
        dispatch(setSelectedShiftUser([]));
        dispatch(fetchShiftLogs());
      } else if (response.status === 206) {
        toast.info(`${response.data.message}`);
        setFormData({
          kullanici: "",
          baslangicTarihi: "",
          donusTarihi: "",
          baslangicSaati: "",
          bitisSaati: "",
        });
        dispatch(setSelectedShiftUser([]));
        dispatch(fetchShiftLogs());
      } else if (response.status === 400) {
        toast.info(`${response.data.message}`);
      }
    } catch (err) {
      console.log(err.response.data || "HATA");
    }
  };
  console.log(selectedShiftUser);
  return (
    <div className="w-full h-full flex flex-col ">
      {/* form komponent... */}
      <div className="w-auto h-1/4  rounded-md  flex   text-black   ">
        {/* 1 */}
        <div className="w-[30%] border-r border-black ">
          <div className="w-full h-44 overflow-y-auto rounded-md p-2">
            <h1 className="w-full font-bold py-1 text-center text-black bg-[#a6aebf] rounded-t-md">
              Seçilen Kullanıcılar
            </h1>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {selectedShiftUser.map((item, index) => (
                <div
                  key={index}
                  className="relative bg-white shadow-md p-1 rounded-md text-center text-black font-medium border border-gray-300"
                >
                  <span>{item.op_username}</span>
                  {/* Kapatma butonu */}
                  <button
                    onClick={() =>
                      dispatch(
                        setSelectedShiftUser(
                          selectedShiftUser.filter(
                            (selectedItem) =>
                              selectedItem.id_dec !== item.id_dec
                          )
                        )
                      )
                    }
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* 2 */}
        <div className="w-[35%] flex flex-col justify-between h-full p-2">
          {/* Sol taraf */}
          <div className="w-full flex gap-x-2">
            {/* Başlangıç Tarihi */}
            <div className="w-1/2">
              <label className="block mb-2 font-semibold text-sm">
                Mesai Başlangıç Tarihi:
              </label>
              <input
                type="date"
                name="baslangicTarihi"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
                onChange={handleInputChange}
                value={formData.baslangicTarihi}
              />
            </div>
            {/* Bitiş Tarihi */}
            <div className="w-1/2">
              <label className="block mb-2 font-semibold text-sm">
                Mesai Bitiş Tarihi:
              </label>
              <input
                type="date"
                name="donusTarihi"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
                onChange={handleInputChange}
                value={formData.donusTarihi}
              />
            </div>
          </div>
          {/* Sağ taraf */}
          <div className="w-full flex gap-x-2">
            {/* Başlangıç Saati */}
            <div className="w-1/2">
              <label className="block mb-2 font-semibold text-sm">
                Mesai Başlangıç Saati
              </label>
              <select
                name="baslangicSaati"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
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
            {/* Bitiş Saati */}
            <div className="w-1/2">
              <label className="block mb-2 font-semibold text-sm">
                Mesai Bitiş Saati
              </label>
              <select
                name="bitisSaati"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
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
        </div>
        {/* 3 */}
        <div className="w-[35%] flex flex-col justify-between items-center gap-y-4">
          {/* İlk Kart */}
          <div className="w-[95%] bg-blue-100 border border-blue-300 rounded-lg  shadow-md">
            <h3 className="text-md font-bold text-blue-700 text-center">
              Bugünkü Mesai
            </h3>
            <p className="text-2xl font-semibold text-center text-blue-800">
              {/* Placeholder değer */}
              {usersOnShifts.length || 0}
            </p>
            <p className="text-sm text-center text-gray-500">
              Bugün oluşturulan toplam mesai kaydı.
            </p>
          </div>
          {/* İkinci Kart */}
          <div className="w-[95%] mb-2   flex  justify-center gap-x-4  items-center">
            <Button
              className=" bg-green-500 hover:bg-green-500 w-1/3"
              children="Oluştur"
              onClick={handleCreateShıft}
            />
            <Button
              className=" bg-red-500 hover:bg-red-500 w-1/3"
              children="İptal"
              onClick={() => handleCancelShift(selection_shift)}
            />
          </div>
        </div>
      </div>
      {/* table */}
      <div className="h-3/4  w-auto sm:w-full rounded-md flex">
        <div className="w-1/3 h-full">
          <UserTable />
        </div>
        {/* charts */}
        <div className="w-2/3 h-full">
          <ShiftTable />
          {/* <div className="h-1/2 flex justify-center items-end">
            {" "}
            <ShiftChart />
          </div>
          <div className="h-1/2 flex justify-center items-center">
            <WeeklyShiftTrendChart />{" "}
          </div> */}
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
