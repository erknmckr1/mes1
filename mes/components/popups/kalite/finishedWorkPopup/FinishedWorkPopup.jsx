import React from "react";
import { useSelector } from "react-redux";
import { setFinishedWorkPopup } from "@/redux/orderSlice";
import { useState, useEffect } from "react";
import Button from "../../../ui/Button";
import Input from "../../../ui/Input";
import { useFinishedWorkLogic } from "./useFinishedWorkLogic";
import { setUser } from "@/redux/userSlice";

function FinishedWorkPopup() {
  // veriler Bu verilere globalde ıhtıyac duyulursa redux a tası...

  const {
    getRepairReason,
    nextProcess,
    resetFinishedPopupState,
    finishedWork,
    handleFinishWork,
    repairReasonsList,
    selectedScrapReason,
    finishedAmount,
    setFinishedAmount,
    scrapAmount,
    setScrapAmount,
    productCount,
    setProductCount,
    repairAmount,
    setRepairAmount,
    desc,
    setDesc,
    retryAction,
    setRetryAction,
    repairReasons,
    setRepairReasons,
    user,
    userInfo,
    dispatch,
    areaName,
    selectedArea,
    setSelectedArea,
  } = useFinishedWorkLogic();

  const { finishedPopupMode } = useSelector((state) => state.order);
  const { theme } = useSelector((state) => state.global);

  useEffect(() => {
    if (retryAction && user && user.id_dec) {
      switch (retryAction) {
        case "finishwork":
          handleFinishWork();
          setRetryAction(null); // tekrar çağrılmasını önlemek için temizle
          break;
      }
    }
  }, [retryAction, user]); // <== Buraya dikkat!

  // Tamır kısmında bolumu secerken tetıklenecek change eventı
  const handleChange = (event) => {
    setSelectedArea(event.target.value);
  };

  const areas = ["YALDIZ", "CİLA", "LAZER", "TAMİR TEZGAHI", "MİNE", "MONTAJ"];

  useEffect(() => {
    getRepairReason();
  }, []);

  //* tamir nedenleri state ini guncelleyecek fonksıyon...
  const updateRepairReason = (index, value) => {
    // ID ile eşleşen repair reason'u bul ve güncelle
    const selectedReason = repairReasonsList.find(
      (item) => item.repair_reason_id === value
    );
    if (selectedReason) {
      setRepairReasons((prev) => {
        const newReasons = [...prev];
        newReasons[index] = selectedReason.repair_reason;
        return newReasons;
      });
    } else if (selectedReason === undefined) {
      setRepairReasons((prev) => {
        const newReasons = [...prev];
        newReasons[index] = "";
        return newReasons;
      });
    }
  };

  // Popup ı kapatacak fonksiyon...
  const handleClosePopup = () => {
    dispatch(setFinishedWorkPopup(false));
    dispatch(setUser(null));
  };

  // Ekrana göre çalışacak bitirme fonksiyonu...
  const handFinishWork = () => {
    if (areaName === "kalite") {
      finishedWork();
    } else {
      handleFinishWork();
    }
  };

  const handleClickBasedOnMode = () => {
    if (finishedPopupMode === "nextProcess" && areaName === "cila") {
      nextProcess(); // Bu, iş bitirme ve yeni başlatmayı içeriyor
    } else {
      handFinishWork(); // Sadece iş bitirme senaryosu
    }
  };

  const buttons = [
    {
      onClick: handleClosePopup,
      children: "Vazgeç",
      type: "button",
      className: "",
    },
    {
      onClick: handleClickBasedOnMode,
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
      className={`fixed w-screen h-screen top-0 left-0 flex items-center justify-center bg-black bg-opacity-75 z-[50] ${
        theme === "dark" ? "dark-mode" : "light-mode"
      }`}
    >
      {/* Popup İçeriği */}
      <div className="w-[90%] max-w-[1800px] h-[90%] max-h-[900px]  popup-content shadow-2xl rounded-xl p-6 relative flex flex-col">
        {/* Başlık */}
        <div className="popup-header h-[20%] text-white font-bold text-6xl flex items-center justify-center rounded-t-xl shadow-md">
          Siparişi Bitir
        </div>

        {/* İçerik Alanı */}
        <div className="flex flex-col gap-y-10 mt-6">
          {/* Input Alanı */}
          <div className="flex justify-evenly w-full">
            {(areaName === "kalite" ||
              areaName === "cila" ||
              areaName === "telcekme") && (
              <Input
                addProps="h-20 text-[30px] text-center font-semibold text-black"
                placeholder={"Sağlam Çıkan Ürün (gr)"}
                value={finishedAmount}
                onChange={(e) => setFinishedAmount(e.target.value)}
                type="number"
              />
            )}

            {/* hurda input  */}
            {areaName === "cila" ||
              areaName === "cekic" ||
              (areaName === "telcekme" && (
                <Input
                  addProps="h-20 text-[30px] text-center font-semibold text-black"
                  placeholder="Hurda Miktarı (gr)"
                  value={scrapAmount}
                  onChange={(e) => setScrapAmount(e.target.value)}
                  //  disabled={areaName !== "cekic" && finishedAmount > 0 ? false : true}
                  type="number"
                />
              ))}
            {/*  çıkan adet input  */}
            {areaName === "cila" && (
              <Input
                addProps="h-20 text-[30px] text-center font-semibold text-black"
                placeholder="Ürün Adeti"
                value={productCount}
                onChange={(e) => setProductCount(e.target.value)}
                disabled={false}
                type="number"
              />
            )}
            {/* tamir input */}
            {areaName === "kalite" && (
              <Input
                addProps="h-20 text-[30px] text-center font-semibold text-black"
                placeholder="Tamire Gidecek Ürün (gr)"
                value={finishedAmount > 0 ? repairAmount : ""}
                onChange={(e) => setRepairAmount(e.target.value)}
                disabled={finishedAmount > 0 ? false : true}
                type="number"
              />
            )}
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
                    {selectedArea && (
                      <p className="text-white font-semibold mt-2 p-2">
                        Seçilen Bölüm: {selectedArea}
                      </p>
                    )}
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
