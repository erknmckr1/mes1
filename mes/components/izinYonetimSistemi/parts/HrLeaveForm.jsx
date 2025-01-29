import React from "react";
import axios from "axios";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

function HrLeaveForm() {
  const [leaveResons, setLeaveReasons] = useState([]);
  const [user, setUser] = useState(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [formData, setFormData] = useState({
    kullanici: "",
    baslangicTarihi: "",
    donusTarihi: "",
    tel: "",
    adres: "",
    aciklama: "",
    izinSebebi: "",
  });
  const { userInfo, allUser } = useSelector((state) => state.user);

  useEffect(() => {
    const getLeaveReasons = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/leave/getLeaveReasons`
        );
        setLeaveReasons(response.data);
      } catch (err) {
        console.log(err);
      }
    };
    getLeaveReasons();
  }, []);

  const handleSelectedReason = (e) => {
    setSelectedReason(e.target.value);
    setFormData({ ...formData, izinSebebi: e.target.value });
  };

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

  // Kullanıcı arama input'unda değişiklik olduğunda filtreleme işlemi yapıyoruz.
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Eğer input boş değilse kullanıcıları filtrele
    if (value.trim() !== "" && name === "kullanici") {
      const filtered = allUser?.filter((item) =>
        item.op_username.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredUsers(filtered);
      setDropdownVisible(true); // Dropdown'u görünür yap
    } else {
      setFilteredUsers([]);
      setDropdownVisible(false); // Input boşsa dropdown'u kapat
    }
  };

  //! Yeni izin talebi olusturmak ıcın gereklı query
  const handleCreateLeave = async (e) => {
    e.preventDefault();

    if(user === null){
      toast.error("Kullanıcı bilgileri çekilmedi.");
      return;
    }
    
    const { id_dec, op_username, auth1, auth2 } = user;
    try {
      if (
        formData.baslangicTarihi !== "" &&
        formData.donusTarihi !== "" &&
        formData.kullanici !== "" &&
        formData.izinSebebi !== ""
      ) {
        const baslangicDate = new Date(formData.baslangicTarihi);
        const donusDate = new Date(formData.donusTarihi);

        if (baslangicDate >= donusDate) {
          toast.error("Başlangıç zamanı bitiş zamanından küçük olmalı.");
          return;
        }

        if (
          confirm(
            `${op_username}/${user?.id_dec} kullanıcısı için izin talebi olusturulsun mu ?`
          )
        ) {
          if (
            selectedUser.id_dec === user.id_dec ||
            selectedUser.id_hex === user.id_hex
          ) {
            const response = await axios.post(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/leave/createNewLeaveByIK`,
              {
                formData,
                id_dec,
                op_username,
                auth1,
                auth2,
                userInfo,
              }
            );

            if (response.status === 200) {
              toast.success(
                `${formData.kullanici}/${user?.op_username} kullanıcısı için başarıyla izin olusturuldu.`
              );
              // Form verilerini sıfırla
              await setFormData({
                kullanici: "",
                baslangicTarihi: "",
                donusTarihi: "",
                tel: "",
                adres: "",
                aciklama: "",
                izinSebebi: "",
              });
              setUser(null);
              setSelectedUser(null);
              setSelectedReason("");
            } else {
              toast.error(
                `${formData.kullanici}/${user?.op_username} kullanıcısı için izin olusturulamadı.`
              );
            }
          } else {
            toast.error(
              "Personel id'yi okuttuktan sonra 'Personel Ara' butonuna tıklamayı unutmayın. Girilen id ile izin olusturmaya calıstıgınız personelin id'si uyusmuyor."
            );
            setSelectedUser(null);
            setSelectedReason("");
          }
        }
      }
    } catch (err) {
      console.log(err);
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

  return (
    <div className="text-black p-4">
      <form onSubmit={handleCreateLeave}>
        <div className="grid grid-cols-2 gap-2 gap-x-4">
          <div className="relative">
            <label className="block mb-2 font-semibold">Kullanıcı İd</label>
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
                <div className="max-h-[300px] absolute p-2 overflow-y-scroll left-0 right-0 shadow-xl bg-white transition-all duration-200 ">
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
          <div>
            <label className="block mb-2 font-semibold">
              Kullanıcı Bilgilerini Al
            </label>
            <button
              type="button"
              onClick={handleSearchUser}
              className="p-2 bg-slate-600 hover:bg-slate-400 transition-all rounded-md text-white"
            >
              Personel Ara
            </button>
          </div>
          <div>
            <label className="block mb-2 font-semibold">
              İzin Başlangıç Tarihi:
            </label>
            <input
              type="datetime-local"
              name="baslangicTarihi"
              className="w-full p-2 border rounded-md"
              required
              onChange={handleInputChange}
              value={formData.baslangicTarihi}
            />
          </div>
          <div>
            <label className="block mb-2 font-semibold">
              İşe Dönüş Tarihi:
            </label>
            <input
              type="datetime-local"
              name="donusTarihi"
              className="w-full p-2 border rounded-md"
              required
              onChange={handleInputChange}
              value={formData.donusTarihi}
            />
          </div>
          <div className="w-full h-12">
            <label className="block mb-2 font-semibold">
              İzin Nedeni Seçiniz:
            </label>
            <select
              name="izinSebebi"
              className="text-black w-full h-full border rounded-md"
              value={selectedReason}
              onChange={handleSelectedReason}
            >
              <option value="">Seçiniz:</option>
              {leaveResons &&
                leaveResons.map((item, index) => {
                  // roleId 7 ise "Doktor Sevk" VEYA "Doktor Istirahat" göster
                  if (userInfo?.roleId === 7) {
                    if (
                      item.leave_reason === "Doktor Sevk" ||
                      item.leave_reason === "Doktor Istirahat"
                    ) {
                      return (
                        <option
                          className="text-[20px]"
                          key={index}
                          value={item.leave_reason}
                        >
                          {item.leave_reason}
                        </option>
                      );
                    }
                  }
                  // roleId 7 değilse, "Doktor Sevk" ve "Doktor Istirahat" haricini göster
                  else {
                    if (
                      item.leave_reason !== "Doktor Sevk" &&
                      item.leave_reason !== "Doktor Istirahat"
                    ) {
                      return (
                        <option
                          className="text-[20px]"
                          key={index}
                          value={item.leave_reason}
                        >
                          {item.leave_reason}
                        </option>
                      );
                    }
                  }
                  return null;
                })}
            </select>
          </div>
          <div>
            <label className="block mb-2 font-semibold">
              Ulaşılabilecek Tel:
            </label>
            <input
              type="number"
              name="tel"
              className="w-full p-2 border rounded-md"
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label className="block mb-2 font-semibold">
              Ulaşılabilecek Adres:
            </label>
            <textarea
              name="adres"
              className="w-full p-2 border rounded-md"
              rows="3"
              onChange={handleInputChange}
            ></textarea>
          </div>
          <div>
            <label className="block mb-2 font-semibold">Açıklama:</label>
            <textarea
              name="aciklama"
              className="w-full p-2 border rounded-md"
              rows="3"
              onChange={handleInputChange}
            ></textarea>
          </div>
        </div>
        <div className="flex justify-start space-x-4 mt-4">
          <button
            type="submit"
            className="px-4 py-2 bg-green-500 text-white rounded-md"
          >
            Kaydet
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-red-500 text-white rounded-md"
          >
            Kapat
          </button>
        </div>
      </form>
      {user && (
        <div className="py-4">
          <h1 className="font-bold mb-4">İzin Alınacak Personel</h1>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <span className="font-semibold">Personel Ad Soyad:</span>
              <span className="p-2">{user?.op_username}</span>
            </div>
            <div>
              <span className="font-semibold">Personel ID:</span>
              <span className="p-2">{user?.id_dec}</span>
            </div>
            <div>
              <span className="font-semibold">Çalıştığı Bölüm:</span>
              <span className="p-2">{user?.op_section}</span>
            </div>
            <div>
              <span className="font-semibold">Çalıştığı Birim:</span>
              <span className="p-2">{user?.part}</span>
            </div>
            <div>
              <span className="font-semibold">Görev:</span>
              <span className="p-2">{user?.title}</span>
            </div>
            <div>
              <span className="font-semibold">1. Onaycı:</span>
              <span className="p-2">{user?.auth1}</span>
            </div>
            <div>
              <span className="font-semibold">2. Onaycı:</span>
              <span className="p-2">{user?.auth2}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HrLeaveForm;
