import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setFinishedWorkPopup, setSelectedOrder } from "@/redux/orderSlice";
import { useState, useEffect } from "react";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import axios from "axios";
import { toast } from "react-toastify";
import { getWorkList } from "@/api/client/cOrderOperations";
import { usePathname } from "next/navigation";

function FinishedWorkPopup() {
  // veriler Bu verilere globalde ıhtıyac duyulursa redux a tası...

  const [finishedAmount, setFinishedAmount] = useState(0);
  const [scrapAmount, setScrapAmount] = useState(0);
  const [repairAmount, setRepairAmount] = useState(0);
  const [repairReasonsList, setRepairReasonsList] = useState([]);
  const [selectedScrapReason, setSelectedScrapReason] = useState("");
  const [repairReasons, setRepairReasons] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [desc, setDesc] = useState("");
  const [selectedArea, setSelectedArea] = useState("");

  // veriler
  const dispatch = useDispatch();
  const { selectedOrder } = useSelector((state) => state.order);
  const { userInfo } = useSelector((state) => state.user);
  const { theme } = useSelector((state) => state.global);
  const pathName = usePathname();
  const areaName = pathName.split("/")[3];

  // Tamır kısmında bolumu secerken tetıklenecek change eventı
  const handleChange = (event) => {
    setSelectedArea(event.target.value);
  };

  //! Tamir nedenlerını getıren metot...
  const getRepairReason = async () => {
    try {
      const result = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/getRepairReason`,
        { params: { area_name: areaName } } // get metodu ıle parametre yolluyorsan params ı kullan.
      );
      setRepairReasonsList(result.data);
      return result.data;
    } catch (err) {
      console.error("Error fetching break reasons:", err);
    }
  };

  const areas = ["YALDIZ", "CİLA", "LAZER", "TAMİR TEZGAHI", "MİNE", "MONTAJ"];

  useEffect(() => {
    getRepairReason();
  }, []);

  //* tamir nedenleri state ini guncelleyecek fonksıyon...
  const updateRepairReason = (index, value) => {
    // ID ile eşleşen repair reason'u bul ve güncelle
    console.log(index, value);
    const selectedReason = repairReasonsList.find(
      (item) => item.repair_reason_id === value
    );
    console.log(selectedReason);
    if (selectedReason) {
      setRepairReasons((prev) => {
        const newReasons = [...prev];
        newReasons[index] = selectedReason.repair_reason;
        return newReasons;
      });
    }else if (selectedReason === undefined){
      setRepairReasons((prev) => {
        const newReasons = [...prev];
        newReasons[index] = "";
        return newReasons;
      });
    }
  };

  //! Siparişi bitirmek için tetiklenecek fonksiyon...
  const finishedWork = async () => {
    try {
      if (finishedAmount > 0) {
        // tamir miktarı gırılmısse tamır nedenı secılmedıyse uyarı ver...
        if (repairAmount > 0 && !repairReasons.some((reason) => reason)) {
          toast.error("Lütfen tamir nedeni giriniz.");
          return;
        }

        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/finishedWork`,
          {
            uniq_id: selectedOrder[0].uniq_id,
            work_finished_op_dec: userInfo.id_dec,
            produced_amount: finishedAmount,
            repair_amount: repairAmount,
            scrap_amount: scrapAmount,
            repair_reason: JSON.stringify(repairReasons),
            repair_reason_1: repairReasons[0],
            repair_reason_2: repairReasons[1],
            repair_reason_3: repairReasons[2],
            repair_reason_4: repairReasons[3],
            scrap_reason: selectedScrapReason?.repair_reason,
            repair_section: selectedArea,
            end_desc: desc,
          }
        );
        // işlem eger basarılı ise workList i guncelle ve stateleri baslangıc durumuna getır
        if (response.status === 200) {
          getWorkList({ areaName, userId: userInfo.id_dec, dispatch });
          toast.success("Prosesi bitirme işlemi başarılı...");
          dispatch(setFinishedWorkPopup(false));
          setRepairAmount("");
          dispatch(setSelectedOrder(null));
          setScrapAmount("");
          setFinishedAmount("");
          setSelectedScrapReason("");
          setRepairReasons(["", "", "", ""]);
          setDesc("");
        }
      } else {
        toast.error("Sağlam çikan ürün miktarini giriniz.");
      }
    } catch (err) {
      console.log(err);
      toast.error("İşlem başarısız oldu.");
    }
  };

  const buttons = [
    {
      onClick: () => dispatch(setFinishedWorkPopup(false)),
      children: "Vazgeç",
      type: "button",
      className: "",
    },
    {
      onClick: finishedWork,
      children: "Prosesi Bitir",
      type: "submit",
      className: "bg-red-600 hover:bg-red-500",
    },
  ];

  useEffect(() => {
    const showMore = () => {
      if (!finishedAmount || finishedAmount <= 0) {
        setRepairAmount("");
        setScrapAmount("");
      }
    };
    showMore();
  }, [finishedAmount]);

  return (
    <div
      className={`fixed w-screen h-screen top-0 left-0 flex items-center justify-center bg-black bg-opacity-75 z-[9999] ${
        theme === "dark" ? "dark-mode" : "light-mode"
      }`}
    >
      {/* Popup İçeriği */}
      <div className="w-[90%] max-w-[1800px] h-[90%] max-h-[900px] popup-content shadow-2xl rounded-xl p-6 relative flex flex-col">
        {/* Başlık */}
        <div className="popup-header h-[20%] text-white font-bold text-6xl flex items-center justify-center rounded-t-xl shadow-md">
          Siparişi Bitir
        </div>

        {/* İçerik Alanı */}
        <div className="flex flex-col gap-y-10 mt-6">
          {/* Input Alanı */}
          <div className="flex justify-evenly w-full">
            <Input
              addProps="h-20 text-[30px] text-center font-semibold text-black"
              placeholder="Sağlam Çıkan Ürün (gr)"
              value={finishedAmount}
              onChange={(e) => setFinishedAmount(e.target.value)}
              type="number"
            />
            <Input
              addProps="h-20 text-[30px] text-center font-semibold text-black"
              placeholder="Tamire Gidecek Ürün (gr)"
              value={finishedAmount > 0 ? repairAmount : ""}
              onChange={(e) => setRepairAmount(e.target.value)}
              disabled={finishedAmount > 0 ? false : true}
              type="number"
            />
          </div>

          {/* Tamir Nedenleri ve Açıklama Alanı */}
          <div className="flex gap-x-4">
            {repairAmount > 0 && (
              <div className="w-2/3 popup-table">
                <div className="popup-table-header text-center py-2 text-xl">
                  Tamir Nedenleri
                </div>
                <div className="popup-table-body">
                  <div className="flex p-2 gap-x-2">
                    {repairReasons.map((reason, index) => (
                      <Input
                        key={index}
                        addProps="h-20 text-[30px] text-center font-semibold text-white popup-input"
                        placeholder={`${index + 1}. Neden`}
                        onChange={(e) =>
                          updateRepairReason(index, e.target.value)
                        }
                        type="number"
                        disabled={index > 0 && !repairReasons[index - 1]}
                      />
                    ))}
                  </div>

                  {/* Seçili Nedenler */}
                  <div className="flex flex-wrap gap-3 mt-4 text-center">
                    {repairReasons.map((reason, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-gray-800 text-white rounded-md shadow-md"
                      >
                        {index + 1}. {reason}
                      </span>
                    ))}
                  </div>

                  {/* Tamire Gidecek Bölüm Seçimi */}
                  <div className="mt-6">
                    <select
                      className="popup-select"
                      name="areas"
                      id="areas"
                      value={selectedArea}
                      onChange={handleChange}
                    >
                      <option value="">Tamire gidilecek bölüm</option>
                      {areas.map((item, index) => (
                        <option key={index} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                    {selectedArea && <p className="text-white font-semibold mt-2 p-2">
                      Seçilen Bölüm: {selectedArea}
                    </p>}
                  </div>
                </div>
              </div>
            )}

            {/* Açıklama Alanı */}
            {finishedAmount > 0 && (
              <div className="w-1/3 popup-table">
                <div className="popup-table-header text-center py-2 text-xl ">
                  Açıklama Alanı
                </div>
                <div className="popup-table-body ">
                  <textarea
                    className="popup-textarea w-full h-[200px] text-[35px] text-center font-semibold text-black"
                    placeholder="Açıklama Giriniz"
                    onChange={(e) => setDesc(e.target.value)}
                    value={desc}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Butonlar */}
        <div className="flex justify-center gap-6 mt-6">
          {buttons.map((item, index) => (
            <Button
              key={index}
              onClick={item.onClick}
              className={`${
                item.type === "submit"
                  ? "popup-button primary"
                  : item.type === "button"
                  ? "popup-button danger"
                  : "popup-button secondary"
              }`}
            >
              {item.children}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FinishedWorkPopup;
