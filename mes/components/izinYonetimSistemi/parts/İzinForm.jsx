import React from "react";
import axios from "axios";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
function IzinForm() {
  const { userInfo, user } = useSelector((state) => state.user);
  const { isCreateLeavePopup } = useSelector((state) => state.global); // Popup açık mı?
  const [leaveResons, setLeaveReasons] = useState();
  const [selectedReason, setSelectedReason] = useState("");
  const [formData, setFormData] = useState({
    kullanici: "",
    izinTipi: "",
    izinTuru: "",
    baslangicTarihi: "",
    donusTarihi: "",
    tel: "",
    adres: "",
    aciklama: "",
    izinSebebi: "",
  });

  //! sebepleri çek
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

  // Sebep seç
  const handleSelectedReason = (e) => {
    setSelectedReason(e.target.value);
    setFormData({
      ...formData,
      izinSebebi: e.target.value,
    });
  };
  
  //todo bırden fazla elemanlı bır nesnenın oncekı verılerını degıstırmeden ılgılı elemanı guncellemek ıcın olusturdugumuz fonksıyon...
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Önceki form data verilerini korur. name ile belirtilen değeri 'value' ile günceller...
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Form data backend'e gönderme işlemi burada yapılacak
  const handleSubmit = (e) => {
    e.preventDefault();
  };

  //! Yenı bir izin kaydı olusturacak fonksıyon...
  const handleCreateLeave = async () => {
    // Öncelikli olarak `user` kullanılmalı, eğer boşsa `userInfo`
    const activeUser = isCreateLeavePopup && user ? user : userInfo;

    if (!activeUser || !activeUser.id_dec) {
      toast.error("Kullanıcı bilgisi eksik! Lütfen tekrar deneyin.");
      return;
    }
    try {
      if (
        formData.baslangicTarihi === "" ||
        formData.donusTarihi === "" ||
        selectedReason === ""
      ) {
        toast.error(
          "Lütfen tüm alanları doldurunuz. (İzin Nedeni-Başlangıç-Bitiş Tarihleri)"
        );
        return;
      }

      const baslangicDate = new Date(formData.baslangicTarihi);
      const donusDate = new Date(formData.donusTarihi);

      if (baslangicDate >= donusDate) {
        toast.error("Başlangıç zamanı bitiş zamanından küçük olmalı.");
        return;
      }

      if (confirm("İzin talebinizi oluşturmak istediğinizden emin misiniz?")) {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/leave/createNewLeave`,
          {
            formData,
            selectedReason,
            id_dec: activeUser.id_dec, // Kullanıcı ID
            op_username: activeUser.op_username, // Kullanıcı adı
            auth1: activeUser.auth1, // İlk onaycı
            auth2: activeUser.auth2, // İkinci onaycı
          }
        );

        if (response.status === 200) {
          toast.success("İzin talebi başarıyla oluşturuldu.");
          setFormData({
            kullanici: "",
            izinTipi: "",
            izinTuru: "",
            baslangicTarihi: "",
            donusTarihi: "",
            tel: "",
            adres: "",
            aciklama: "",
            izinSebebi: "",
          });
        } else {
          toast.error("İzin talebi oluşturulamadı...");
        }
      }
    } catch (err) {
      console.log(err);
      toast.error(err.response.data.message);
    }
  };

  // Formu sıfırlayacak fonksıyon
  function handleResetForm() {
    setFormData({
      kullanici: "",
      izinTipi: "",
      izinTuru: "",
      baslangicTarihi: "",
      donusTarihi: "",
      tel: "",
      adres: "",
      aciklama: "",
      izinSebebi: "",
    });
  }

  return (
    <form className="text-black p-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-2 gap-x-4">
        <div>
          <label className="block mb-2 font-semibold">
            İzin Başlangıç Tarihi:
          </label>
          <input
            type="datetime-local"
            name="baslangicTarihi"
            className="w-full p-2 border rounded-md"
            value={formData.baslangicTarihi}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label className="block mb-2 font-semibold">İşe Dönüş Tarihi:</label>
          <input
            type="datetime-local"
            name="donusTarihi"
            className="w-full p-2 border rounded-md"
            value={formData.donusTarihi}
            onChange={handleInputChange}
            required
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
                return null;
              })}
          </select>
        </div>
        <div>
          <label className="block mb-2 font-semibold">
            Ulaşılabilecek Tel:
          </label>
          <input
            type="tel"
            name="tel"
            className="w-full p-2 border rounded-md"
            value={formData.tel}
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
            value={formData.adres}
            onChange={handleInputChange}
          ></textarea>
        </div>
        <div>
          <label className="block mb-2 font-semibold">Açıklama:</label>
          <textarea
            name="aciklama"
            className="w-full p-2 border rounded-md"
            rows="3"
            value={formData.aciklama}
            onChange={handleInputChange}
          ></textarea>
        </div>
      </div>
      <div className="flex justify-start space-x-4">
        <button
          type="submit"
          className="px-4 py-2 bg-green-500 text-white rounded-md"
          onClick={handleCreateLeave}
        >
          Kaydet
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-red-500 text-white rounded-md"
          onClick={handleResetForm}
        >
          Bilgileri Sıfırla
        </button>
      </div>
    </form>
  );
}

export default IzinForm;
