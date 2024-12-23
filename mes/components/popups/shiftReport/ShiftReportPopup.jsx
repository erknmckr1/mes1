import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { setShiftReportPopup, fetchShiftLogs } from "@/redux/shiftSlice";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { FaRegSave, FaDownload, FaSearch, FaCalendarAlt } from "react-icons/fa";
import { MdDeleteOutline } from "react-icons/md";
import { RiArrowGoBackLine } from "react-icons/ri";
import { IoExitOutline } from "react-icons/io5";
import axios from "axios";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import "jspdf-autotable";

function ShiftReportPopup() {
  const dispatch = useDispatch();
  const [selectedService, setSelectedService] = useState([]); // seçili servisi tutacak state...
  const [selectedServiceIndex, setSelectedServiceIndex] = useState([]); // servis seçim esnasında onUserShıft ı shıft ındex'e göre sıralayp tutacak state sol tablo
  const [draggedItemIndex, setDraggedItemIndex] = useState(null); // surukleme esnasında sol tarafdaki tabledan secılenın index'ini tutacak state...
  const [draggedShiftItem, setDraggedShiftItem] = useState({}); // Mesai kayıtları tablosunda (sol taraf) suruklenen kaydın bılgılerını tutacak state
  const [selectedShift, setSelectedShift] = useState({}); // seçilen mesi kaydının bılgısını tutacak state...
  const { selectedShiftReport, usersOnShifts } = useSelector(
    (state) => state.shift
  );
  const [serviceDate, setServiceDate] = useState("");
  const [filteredServiceList, setFilteredServiceList] = useState([]);

  // tablo verısını pdf olarak al...
  const generatePDF = () => {
    const doc = new jsPDF(); // Yeni PDF belgesi oluştur
    doc.setFont("times", "normal"); // Times New Roman
    // PDF başlığı
    doc.text("Yolcu Listesi", 14, 10);
    doc.setFont("helvetica", "normal"); // jsPDF'nin varsayılan Türkçe destekli fontu

    // Tablo verileri için başlıklar
    const tableColumn = ["Sıra", "ID", "Kullanıcı Adı", "Durak", "Adres"];

    // Tablo verileri (selectedServiceIndex üzerinden)
    const tableRows = selectedServiceIndex.map((item, index) => [
      index + 1,
      item.operator_id,
      item.User.op_username,
      item.station_name,
      item.station_name,
    ]);

    // Tabloyu PDF'e ekle
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20, // Tabloyu PDF'in altına yerleştirme
    });

    // PDF'i indir
    doc.save("YolcuListesi.pdf");
  };

  // Eger ıdarı ısler komponentınde bır
  const groupedData = usersOnShifts.reduce((acc, curr) => {
    const {
      service_key,
      vehicle,
      station_name,
      shift_uniq_id,
      start_date,
      driver_name,
      driver_no,
      end_time,
      morning_service_time,
      evening_service_time,
      start_time,
      vehicle_plate_no,
      opproved_time,
      end_date,
    } = curr;
    if (!service_key) {
      return acc;
    }

    const group_key = service_key;

    // Eğer bu service_key ile grup olusturulmamıssa yenı bır grup olustur.
    if (!acc[group_key]) {
      acc[group_key] = {
        service_key,
        vehicle,
        station_names: new Set(),
        user_count: 0,
        shiftIds: [],
        start_date,
        driver_name,
        driver_no,
        end_time,
        morning_service_time,
        evening_service_time,
        start_time,
        vehicle_plate_no,
        opproved_time,
        end_date,
      };
    }

    // Durak ısmını ekle
    acc[group_key].station_names.add(station_name);
    // Kullanıcı sayısını arttır
    acc[group_key].user_count++;
    // Shıft ıdlerı ekle
    if (shift_uniq_id) {
      acc[group_key].shiftIds.push(shift_uniq_id);
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
    driver_name: data.driver_name,
    driver_no: data.driver_no,
    end_time: data.end_time,
    morning_service_time: data.morning_service_time,
    evening_service_time: data.evening_service_time,
    start_time: data.start_time,
    vehicle_plate_no: data.vehicle_plate_no,
    opproved_time: data.opproved_time,
    end_date: data.end_date,
  }));

  // seçili dataya mı bakılıyor tum dataya mı ?
  const resultDatas = () => {
    return selectedShiftReport.length > 0 ? selectedShiftReport : result;
  };

  //? SOL TARAFTAKİ TABLE ICIN DRAG DROP OLAYLARI
  // drag drop function sol taraftaki table ıcın...
  const handleDragStart = (index, item) => {
    setDraggedItemIndex(index); // Sürüklenen elemanın indeksini kaydet
    setDraggedShiftItem(item);
  };
  // hedef bolgenın uzerınde dolasırken tetıklenır.
  const handleDragOver = (event) => {
    event.preventDefault(); // Tarayıcı varsayılanını engelle
  };

  const handleDrop = (index) => {
    const updatedList = [...selectedServiceIndex];
    const [draggedItem] = updatedList.splice(draggedItemIndex, 1);
    updatedList.splice(index, 0, draggedItem);

    // shift_index değerlerini güncelle
    const reindexedList = updatedList.map((item, idx) => ({
      ...item,
      shift_index: idx + 1, // Yeni sıra numarası
    }));

    setSelectedServiceIndex(reindexedList);
    setDraggedItemIndex(null);
  };
  //? SOL TARAFTAKİ TABLE ICIN DRAG DROP OLAYLARI BITIS

  // Servıs sececek function...
  const handleSelectedRow = (row) => {
    if (row.service_key === selectedService.service_key) {
      setSelectedService([]);
      setSelectedServiceIndex([]);
    } else {
      setSelectedService(row);
      // seçili servise göre datayı filtrele
      // Seçili servise göre datayı filtrele ve shift_index'e göre sırala
      const filteredData = usersOnShifts
        .filter((item) => item.service_key === row.service_key)
        .sort((a, b) => a.shift_index - b.shift_index); // shift_index'e göre sırala
      setSelectedServiceIndex(filteredData);
    }
  };

  // popup ı kapatacak fonksıyon...
  const handleClosePopup = () => {
    dispatch(setShiftReportPopup(false));
    setDraggedShiftItem({});
  };

  // servıs lıstesını guncelleyecek metot.
  const handleFilteredDateService = () => {
    const filteredData = resultDatas().filter(
      (item) => item.start_date === serviceDate
    );
    setFilteredServiceList(filteredData); // Filtrelenmiş veriyi state'e ata
  };
  // ekrandaki seçili elemanları resetleyecek fonksıyon...
  const handleResetServiceData = () => {
    setServiceDate(""); // Tarih seçimini sıfırla
    setFilteredServiceList([]); // Filtrelenmiş veriyi temizle
    setSelectedServiceIndex([]);
    setSelectedService([]);
  };

  const renderData =
    filteredServiceList.length > 0 ? filteredServiceList : resultDatas();

  //! Kısı sırasını guncellemek ıcın gerekli query...
  const savedShiftIndex = async () => {
    try {
      if (confirm("Servis rotası güncellensin mi?")) {
        const response = await axios.put(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/shift/savedShiftIndex`,
          { selectedServiceIndex }
        );

        if (response.status === 200) {
          toast.success("Sıralama başarıyla güncellendi.");
          dispatch(fetchShiftLogs());
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  //! Servis degısıklıgını sağlayacak fonksiyon...
  const handleDropToChangeService = async (item) => {
    if (!draggedShiftItem) {
      toast.error("Tasiyacağınız servis kaydını sürüleyiniz.");
      return;
    }
    try {
      if (confirm("Taşinsin mi ?")) {
        const response = await axios.put(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/shift/moveToDiffService`,
          {
            draggedShiftItem,
            item,
          }
        );
        if (response.status === 200) {
          toast.success(response?.data);
          dispatch(fetchShiftLogs());
        }
        console.log(response)
      }
    } catch (err) {
      console.log(err);
      const errorMessage = err.response?.data?.message || "Bir hata oluştu.";
      toast.error(errorMessage);
    }
  };

  // Serviste bulunan mesai kayıtlarını gosteren tablodan sacılen satırı tutacak state sadece bır satır.
  const handleSelectedShıft = (item) => {
    if (selectedShift.shift_uniq_id === item.shift_uniq_id) {
      setSelectedShift({});
    } else {
      setSelectedShift(item);
    }
  };

  //! Kullanıcıyı servisten cıkaracak query...
  const userOutOfService = async () => {
    if (!selectedShift) {
      toast.error("Servisten cıkaracagınız yolcuyu seçin.");
      return;
    }

    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/shift/userOutOfService`,
        {
          selectedShift,
        }
      );

      if (response.status === 200) {
        toast.success(`${response.data}`);
        setSelectedShift({});
        dispatch(fetchShiftLogs());
      }
    } catch (error) {
      console.log(error);
    }
  };
  console.log(selectedShift);
  return (
    <div className="w-screen    z-50 h-screen top-0 left-0 absolute text-black font-semibold">
      <div className="flex  justify-center items-center w-full h-full">
        <div className="h-[95%] w-[95%] bg-[#FFF8DE]  z-50">
          <div className="flex flex-col gap-x-3 w-full h-full">
            <div className="h-[10%] w-full p-1 flex items-center">
              <Button
                className="bg-red-500 hover:bg-red-600"
                onClick={handleClosePopup}
                children={"Kapat"}
              />
            </div>
            <div className="w-full h-[90%] flex gap-x-3">
              {/* right side */}
              <div className="w-2/3 border h-full flex justify-center items-center border-black ">
                <div className=" border  w-[80%] h-[90%] shadow-2xl shadow-black rounded-md ">
                  <div className="w-full h-full flex flex-col gap-y-1">
                    {/* title */}
                    <div className="w-full rounded-md flex justify-between items-center  h-auto text-center p-2  bg-[#A6AEBF]">
                      <h1 className="w-auto">Yolcu Listesi</h1>
                      <div className="flex w-auto items-center gap-x-5 ">
                        <button
                          onClick={savedShiftIndex}
                          className="p-2 hover:text-black text-[#eceff3]  hover:bg-gray-300 rounded"
                        >
                          {" "}
                          <FaRegSave className="text-xl cursor-pointer" />
                        </button>
                        <button
                          onClick={generatePDF}
                          className="p-2 hover:text-black text-[#eceff3]  hover:bg-gray-300 rounded"
                        >
                          <FaDownload className=" text-xl cursor-pointer" />
                        </button>
                        <button
                          onClick={userOutOfService}
                          className="p-2 hover:text-black text-[#eceff3]  hover:bg-gray-300 rounded"
                        >
                          <MdDeleteOutline  className=" text-xl cursor-pointer"  />
                        </button>
                      </div>
                    </div>
                    <div className="w-full h-full bg-[#eceff3]">
                      <table className="w-full  ">
                        <thead className="bg-[#A6AEBF] text-center">
                          <tr>
                            <th className="py-3 font-semibold underline border border-slate-400 ">
                              Sıra
                            </th>
                            <th className="py-3 font-semibold underline border border-slate-400 ">
                              ID
                            </th>
                            <th className="py-3 font-semibold underline border border-slate-400 ">
                              Kullanıcı Adı
                            </th>
                            <th className="py-3 font-semibold underline border border-slate-400 ">
                              Ünvan
                            </th>
                            <th className="py-3 font-semibold underline border border-slate-400 ">
                              Bölüm
                            </th>
                            <th className="py-3 font-semibold underline border border-slate-400 ">
                              Birim
                            </th>
                            <th className="py-3 font-semibold underline border border-slate-400 ">
                              Durak
                            </th>
                            <th className="py-3 font-semibold underline border border-slate-400 ">
                              Adres
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedServiceIndex.map((item, index) => (
                            <tr
                              key={index}
                              draggable
                              onDragStart={() => handleDragStart(index, item)}
                              onDragOver={handleDragOver}
                              onDrop={() => handleDrop(index)}
                              onClick={() => {
                                handleSelectedShıft(item);
                              }}
                              className={`border-b h-8 hover:bg-slate-300 cursor-pointer ${
                                item.shift_uniq_id ===
                                selectedShift.shift_uniq_id
                                  ? "bg-[#D0E8C5]"
                                  : ""
                              }`}
                            >
                              <td className="text-center border border-slate-400">
                                {index + 1}
                              </td>
                              <td className="text-center border border-slate-400">
                                {item.operator_id}
                              </td>
                              <td className="text-center border border-slate-400">
                                {item.User.op_username}
                              </td>
                              <td className="text-center border border-slate-400">
                                {item.User.title}
                              </td>
                              <td className="text-center border border-slate-400">
                                {item.User.op_section}
                              </td>
                              <td className="text-center border border-slate-400">
                                {item.User.part}
                              </td>
                              <td className="text-center border border-slate-400">
                                {item.station_name}
                              </td>
                              <td className="text-center border border-slate-400">
                                {item.station_name}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              {/* right side */}
              {/* left side */}
              <div className="w-1/3 h-full border border-black flex justify-center items-center">
                {/* data list div */}
                <div className="w-[500px] h-[90%] shadow-2xl shadow-black rounded-md ">
                  <div className="w-full h-full flex flex-col gap-y-1 rounded-md">
                    {/* title - header */}
                    <div className="w-full flex justify-between items-center  h-auto text-center p-2 border bg-[#A6AEBF] rounded-md">
                      <h1 className="w-auto">Servis Listesi</h1>
                      <div className="flex  w-auto items-center gap-x-1">
                        {/* Tarih seçici */}
                        <div className="relative">
                          <input
                            onChange={(e) => setServiceDate(e.target.value)}
                            value={serviceDate}
                            type="date"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <button className="p-2 hover:text-black text-[#eceff3]  hover:bg-gray-300 rounded">
                            <FaCalendarAlt className="text-xl cursor-pointer text-[#eceff3]" />
                          </button>
                        </div>

                        {/* Filtreleme butonu */}
                        <button
                          onClick={handleFilteredDateService}
                          className="p-2 hover:text-black text-[#eceff3]  hover:bg-gray-300 rounded"
                        >
                          <FaSearch className="text-xl text-[#eceff3] cursor-pointer" />
                        </button>

                        {/* Reset butonu */}
                        <button
                          onClick={handleResetServiceData}
                          className="p-2 hover:text-black text-[#eceff3]  hover:bg-gray-300 rounded"
                        >
                          <RiArrowGoBackLine className="text-xl text-[#eceff3] cursor-pointer" />
                        </button>
                      </div>
                    </div>
                    {/* table */}
                    <div className="w-full h-full border bg-[#eceff3] ">
                      <table className="w-full border-collapse border  border-slate-400 ">
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
                            <th className="py-3 font-semibold underline border border-slate-400 ">
                              Başlangıç Saati
                            </th>
                          </tr>
                        </thead>
                        <tbody className="">
                          {renderData.map((item, index) => (
                            <tr
                              key={item.service_key} // Benzersiz key için service_key kullanılıyor
                              className={`w-full cursor-pointer h-8 ${
                                selectedService?.service_key ===
                                item.service_key
                                  ? "bg-[#D0E8C5]" // Seçili satırın arka plan rengi
                                  : index % 2 === 0
                                  ? "bg-[#C5D3E8]" // Varsayılan arka plan rengi
                                  : "bg-[#C5D3E8]"
                              } hover:bg-gray-200`}
                              //style={{ height: "w50px" }}
                              onClick={() => handleSelectedRow(item)} // Satır seçme fonksiyonunu çağır
                              onDragOver={handleDragOver}
                              onDrop={() => handleDropToChangeService(item)}
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
                              <td className="text-center border border-slate-400 ">
                                {item.start_date}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                {/* data list div */}
              </div>
              {/* left side  */}
            </div>
          </div>
        </div>
      </div>
      <div className="w-screen h-screen absolute bg-black opacity-85 top-0 left-0"></div>
    </div>
  );
}

export default ShiftReportPopup;
