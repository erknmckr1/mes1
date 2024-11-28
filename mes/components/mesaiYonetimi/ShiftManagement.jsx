"use client";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { toast } from "react-toastify";
import Button from "../ui/Button";
import { fetchShiftLogs } from "@/redux/shiftSlice";
import { fetchAllUsers } from "@/redux/userSlice";
import ShiftTable from "./ShiftTable";
import { ShiftChart, WeeklyShiftTrendChart } from "./charts/ShiftChart";
import { usePathname } from "next/navigation";
function ShiftManagement() {
  const dispatch = useDispatch();
  const [user, setUser] = useState(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const { userInfo, allUser } = useSelector((state) => state.user);
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
  const handleCancelShift = async (rows) => {
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
        console.log(shiftIds);
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
          setSelectionModel([]);
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
  const handleApproveShift = async (rows) => {
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
          setSelectionModel([]);
        } else if (response === 404) {
          toast.error("Böyle bir mesai kaydı bulunamadı");
        }
      }
    } catch (err) {
      console.log(err);
      toast.error(err.response.data);
    }
  };

  const approveButtons = [
    {
      id: 1,
      onClick: () => handleApproveShift(selectionModel),
      children: "Onayla",
      type: "button",
      className: "w-[70%] py-2 bg-blue-500 hover:bg-blue-600",
    },
    {
      id: 3,
      onClick: () => handleCancelShift(selectionModel),
      children: "İptal",
      type: "button",
      className: "w-[70%] py-2 bg-red-500 hover:bg-red-600",
    },
  ];

  //! Onay ekranı sayfa komponentı...
  function ConfirmShift() {
    return (
      <div className=" w-full">
        <div className="bg-white h-[600px] flex">
          <div className="w-[85%] h-full ml-1">
            <ShiftTable
              selectionModel={selectionModel}
              setSelectionModel={setSelectionModel}
            />
          </div>
          <div className="w-[15%] h-full ">
            <div className="w-full h-2/3 flex items-center justify-center flex-col gap-y-4 ">
              {approveButtons.map((item) => (
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
    <>
      {create_shift_name === "mesaiolustur" && (
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
                            <span className="w-2 font-semibold">
                              {index + 1}-
                            </span>
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
                  İzin Başlangıç Tarihi:
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
                  İşe Dönüş Tarihi:
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
                onClick={() => handleCancelShift(selectionModel)}
              />
            </div>
          </div>
          {/* table */}
          <div className="h-3/4 w-auto sm:w-full  bg-white rounded-md flex">
            <div className="w-2/3 h-full">
              <ShiftTable
                selectionModel={selectionModel}
                setSelectionModel={setSelectionModel}
              />
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
      )}
      {create_shift_name === "mesaionayla" && (
        <div>
          <ConfirmShift />
        </div>
      )}
    </>
  );
}

export default ShiftManagement;
