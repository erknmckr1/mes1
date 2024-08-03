import React from "react";
import axios from "axios";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

function HrLeaveForm() {
  const [leaveResons, setLeaveReasons] = useState([]);
  const [user, setUser] = useState(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [formData, setFormData] = useState({
    kullanici: "",
    baslangicTarihi: "",
    donusTarihi: "",
    tel: "",
    adres: "",
    aciklama: "",
    izinSebebi: "",
  });

  console.log(formData);

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
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/${formData.kullanici}/getuserinfo`
      );
      if (response.status === 200) {
        setUser(response.data);
        toast.success("Kullanıcı bilgileri başarıyla çekildi.");
      }
    } catch (err) {
      console.log(err);
      toast.error("Kullanıcı bilgileri çekilemedi. (Yanlış ID)");
      setUser(null)
    }
  };

  console.log(user);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  //! Yeni izin talebi olusturmak ıcın gereklı query
  const handleCreateLeave = async (e) => {
    e.preventDefault();
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
            `${formData.kullanici}/${user?.id_dec} kullanıcısı için izin talebi olusturulsun mu ?`
          )
        ) {
          if(formData.kullanici === user.id_dec || formData.kullanici === user.id_hex ){
            const response = await axios.post(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/leave/createNewLeaveByIK`,
              {
                formData,
                id_dec,
                op_username,
                auth1,
                auth2,
              }
            );
  
            if (response.status === 200) {
              toast.success(
                `${formData.kullanici}/${user?.op_username} kullanıcısı için başarıyla izin olusturuldu.`
              );
            } else {
              toast.error(
                `${formData.kullanici}/${user?.op_username} kullanıcısı için izin olusturulamadı.`
              );
            }
          }else{
            toast.error("Personel id'yi okuttuktan sonra 'Personel Ara' butonuna tıklamayı unutmayın. Girilen id ile izin olusturmaya calıstıgınız personelin id'si uyusmuyor.")
          }
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="text-black p-4">
      <form onSubmit={handleCreateLeave}>
        <div className="grid grid-cols-2 gap-2 gap-x-4">
          <div>
            <label className="block mb-2 font-semibold">Kullanıcı İd</label>
            <input
              type="text"
              name="kullanici"
              className="w-full p-2 border rounded-md"
              required
              value={formData.kullanici}
              onChange={handleInputChange}
            />
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
              required
            >
              <option value="">Seçiniz:</option>
              {leaveResons &&
                leaveResons.map((item, index) => (
                  <option
                    className="text-[20px]"
                    key={index}
                    value={item.leave_reason}
                  >
                    {item.leave_reason}
                  </option>
                ))}
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
      {user && <div className="py-4">
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
      </div>}
    </div>
  );
}

export default HrLeaveForm;
