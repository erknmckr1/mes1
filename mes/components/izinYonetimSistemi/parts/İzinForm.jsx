import React from "react";
import axios from "axios";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
function IzinForm() {
  const {userInfo} = useSelector(state => state.user)
  const [leaveResons, setLeaveReasons] = useState();
  const [isOpenReason, setİsOpenReason] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [formData, setFormData] = useState({
    izinTipi: "",
    izinTuru: "",
    baslangicTarihi: "",
    donusTarihi: "",
    tel: "",
    adres: "",
    aciklama: "",
    izinSebebi:""
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

  // sebepleri açıp kapatacak fonksıyon...
  const openReasonSelect = () => {
    setİsOpenReason(!isOpenReason);
  };

  // sebep seç
  const handleSelectedReason = (item) => {
    setSelectedReason(item);
    setİsOpenReason(!isOpenReason);
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
    console.log(formData);
  };

  //! Yenı bir izin kaydı olusturacak fonksıyon...
  const handleCreateLeave = async () => {
    const { id_dec, op_username,auth1,auth2 } = userInfo;
    try {
      if (
        formData.izinTuru !== "" &&
        formData.donusTarihi !== "" &&
        formData.baslangicTarihi !== ""
      ) {
        if (confirm("İzin talebinizi oluşturmak istediğinizden emin misiniz?")) {
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/leave/createNewLeave`,
            { formData, selectedReason, id_dec, op_username,auth1,auth2 }
          );
          if (response.status === 200) {
            toast.success("İzin talebi başarıyla oluşturuldu.");
          } else {
            toast.error("İzin talebi oluşturulamadı...");
          }
        }
      } else {
        toast.error("İzin için ilgili yerleri doldurup tekrar deneyin");
      }
    } catch (err) {
      console.log(err);
      toast.error("Bir hata oluştu, lütfen tekrar deneyin.");
    }
  };
  
  return (
    <form className="text-black p-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-2 gap-x-4">
        <div>
          {/* <label className="block mb-2 font-semibold">İzin Tipi:</label>
          <input
            type="text"
            name="izinTipi"
            className="w-full p-2 border rounded-md"
            value={formData.izinTipi}
            onChange={handleInputChange}
            required
          /> */}
        </div>
        <div>
          <label className="block mb-2 font-semibold">İzin Türü</label>
          <select
            name="izinTuru"
            className="w-full p-2 border rounded-md"
            value={formData.izinTuru}
            onChange={handleInputChange}
          >
            <option value="">Seçiniz:</option>
            <option value="mazeret">Mazeret</option>
            <option value="yillikizin">Yıllık İzin</option>
          </select>
        </div>
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

        <div className="relative">
          <label
            onClick={openReasonSelect}
            className="block mb-2 font-semibold underline text-red-600"
          >
            İzin Nedeni Seçmek İçin Tıklayınız
          </label>
          {selectedReason && (
            <span className="font-bold">Seçili neden: {selectedReason}</span>
          )}
          {isOpenReason && (
            <div className="w-auto h-auto absolute z-50 bg-blue-500">
              <div className="flex flex-col h-[300px] overflow-auto rounded-md shadow-md bg-slate-100 font-semibold">
                {leaveResons &&
                  leaveResons.map((item, index) => (
                    <span
                      onClick={() => handleSelectedReason(item.leave_reason)}
                      className="border-b p-2 cursor-pointer hover:bg-slate-200"
                      key={index}
                    >
                      {item.leave_reason}
                    </span>
                  ))}
              </div>
            </div>
          )}
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
        >
          Kapat
        </button>
      </div>
    </form>
  );
}

export default IzinForm;
