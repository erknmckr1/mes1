import React from "react";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import {
  setStopReasonPopup,
  setSelectedOrder,
  handleGetGroupList,
  setSelectedGroupNos,
  setFilteredGroup,
  getWorksWithoutId,
} from "@/redux/orderSlice";
import { setUser } from "@/redux/userSlice";
import { usePathname } from "next/navigation";
import axios from "axios";
import { useState, useEffect } from "react";
import Button from "../ui/Button";
import { toast } from "react-toastify";
import { getWorkList } from "@/api/client/cOrderOperations";

function StopJobPopup() {
  const dispatch = useDispatch();
  const stopReasonPopup = useSelector((state) => state.order.stopReasonPopup);
  const { userInfo, user } = useSelector((state) => state.user);
  const pathname = usePathname();
  const areaName = pathname.split("/")[3]; // URL'den sayfa ismini alır
  const [stopReason, setStopReason] = useState(null);
  const [molaSebebi, setMolaSebebii] = useState("");
  const {theme} = useSelector((state) => state.global);
  const { selectedOrder, selectedGroupNo,selectedHammerSectionField } = useSelector(
    (state) => state.order
  );

  //! Durdurma sebeplerini çekecek metot...
  const getBreakReason = async () => {
    try {
      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/getStopReason`,
        { area_name: areaName }
      );
      setStopReason(result.data);
      return result.data; // Veriyi döndürelim ki çağıran fonksiyon kullanabilsin
    } catch (err) {
      console.error("Error fetching break reasons:", err);
    }
  };

  //! Seçilen işi durdurmak için gerekli istek...
  const stopSelectedWork = async () => {
    const isStopScreen = ["buzlama", "cekic","kurutiras"].includes(areaName);
    try {
      if (!molaSebebi) {
        toast.error("Seçili siparişi durdurmak için durdurma nedeni seçiniz.");
        return;
      }

      if (selectedOrder.length === 0) {
        toast.error("Lütfen en az bir sipariş seçin.");
        return;
      }

      const requestData = {
        order_id: selectedOrder.map((item) => item.order_no), // Sipariş numaraları array olarak
        stop_reason_id: molaSebebi.stop_reason_id, // Durdurma nedeni ID
        work_log_uniq_id: selectedOrder.map((item) => item.uniq_id), // İş kayıtları uniq_id array olarak
        user_who_stopped: userInfo?.id_dec, // Kullanıcı ID
        areaName,
        field:selectedHammerSectionField
      };

      if (isStopScreen) {
        requestData.user_who_stopped = user.id_dec;
      }

      // API çağrısını yap
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/stopSelectedWork`,
        requestData
      );

      const opt = () => {
        dispatch(setUser(null));
        dispatch(setStopReasonPopup({ visible: false })); // Popup kapat
        dispatch(setSelectedOrder([])); // Seçimi temizle
        toast.success(`Siparişleri durdurma işlemi başarılı.`);
      };
      if (response.status === 200) {
        if (isStopScreen) {
          dispatch(getWorksWithoutId({ areaName }));
          opt();
        } else {
          getWorkList({ areaName, userId: userInfo.id_dec, dispatch }); // WorkList'i yenile
          opt();
        }
      } else {
        toast.error("Siparişler durdurulamadı.");
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response.data.message ||
          "Sipariş durdurma işlemi başarısız oldu. Lütfen tekrar deneyin."
      );
      dispatch(setUser(null));
      dispatch(setStopReasonPopup({ visible: false })); // Popup kapat
      dispatch(setSelectedOrder([])); // Seçimi temizle
    }
  };

  //! Makineyi durduracak query (grup işlemi)...
  async function stopToSelectedMachine() {
    try {
      if (confirm("Seçili makine durdurulsun mu ? ")) {
        let response;
        if (
          selectedGroupNo &&
          selectedGroupNo.length === 1 &&
          selectedGroupNo[0].group_status === "3" &&
          molaSebebi
        ) {
          response = await axios.put(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/stopToSelectedMachine`,
            {
              selectedGroup: selectedGroupNo[0],
              id_dec: user?.id_dec,
              stop_reason_id: molaSebebi.stop_reason_id,
              area_name: areaName,
            }
          );
        } else {
          toast.error("Durdurma nedenini seçiniz.");
          return;
        }

        if (response.status === 200) {
          toast.success(response.data);
          dispatch(handleGetGroupList());
          dispatch(getWorksWithoutId({ areaName }));
          dispatch(setStopReasonPopup({ visible: false, actionType: "" }));
          dispatch(setSelectedGroupNos([]));
          dispatch(setFilteredGroup([]));
        }
      }
    } catch (err) {
      console.log(err);
      toast.error(
        "Makine durdurma işlemi başarısız oldu. Durdurma nedenini seçip tekrar deneyin."
      );
    }
  }

  const handleAction = () => {
    if (stopReasonPopup.actionType === "order") {
      stopSelectedWork();
    } else if (stopReasonPopup.actionType === "group") {
      stopToSelectedMachine();
    }
  };

  useEffect(() => {
    getBreakReason();
  }, []);
  const buttons = [
    {
      onClick: () => {
        dispatch(setStopReasonPopup({ visible: false, actionType: "" }));
        dispatch(setUser(null));
      },
      children: "Vazgeç",
      type: "button",
      className: "",
    },
    {
      onClick: () => {
        handleAction();
      },
      children:
        stopReasonPopup.actionType === "order"
          ? "Siparişi Durdur"
          : "Grubu Durdur",
      type: "delete",
      className: "bg-red-600 hover:bg-red-500",
    },
  ];

  const sutunİsimleri = [
    "Operator ID",
    "Operator",
    "Durdurma Sebebi",
    "Durdurma Saati",
  ];

  // Date
  const currentDate = new Date().toLocaleString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return (
    <div className={`w-screen h-screen top-0 left-0 absolute z-50 font-semibold bg-black bg-opacity-75 flex items-center justify-center ${theme === "dark" ? "dark-mode" : "light-mode"}`}>
      <div className="md:w-[1300px] w-[800px] h-[600px] bg-white border border-gray-300 shadow-2xl rounded-xl p-4 relative popup-content">
        {/* Header - 20% */}
        <div className="h-[20%] w-full text-xl flex items-center justify-center rounded-t-xl popup-header">
          {stopReasonPopup.actionType === "order"
            ? "Siparişi Durdurma Sebepleri"
            : "Grup Durdurma Sebepleri"}
        </div>
  
        {/* İçerik Alanı - 80% */}
        <div className="h-[80%] w-full mt-1 p-2 rounded-b-xl flex">
          {/* Sebep Listesi */}
          <div className="w-[30%] h-full p-2 flex flex-col">
            <div className="overflow-y-auto flex flex-col gap-2 mt-2">
              {stopReason &&
                stopReason.map((item) => (
                  <span
                    key={item.stop_reason_name}
                    className={`py-3   text-lg cursor-pointer text-center border border-gray-300 rounded-md transition-all duration-300 
                      ${
                        molaSebebi.stop_reason_name === item.stop_reason_name
                          ? "bg-green-600 text-black"
                          : "popup-table hover:bg-gray-300"
                      }`}
                    onClick={() => setMolaSebebii(item)}
                  >
                    {item.stop_reason_name}
                  </span>
                ))}
            </div>
          </div>
  
          {/* Tablo Alanı */}
          <div className="w-[70%] h-full flex flex-col px-2">
            <div className="w-full h-[85%] bg-black rounded-lg p-3">
              <table className="w-full bg-gray-900 text-white rounded-md overflow-hidden">
                <thead className=" text-lg font-semibold popup-table ">
                  <tr>
                    {sutunİsimleri.map((item, index) => (
                      <th key={index} className="p-2 border border-gray-300">
                        {item}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-lg text-center bg-gray-800">
                  {(areaName === "kalite" || areaName === "buzlama" || areaName === "cekic" || areaName === "kurutiras") && (
                    <tr className="h-16 text-white text-xl">
                      <td className="border border-gray-700">{userInfo ? userInfo.id_dec : user.id_dec}</td>
                      <td className="border border-gray-700">{userInfo ? userInfo.op_name : user.op_name}</td>
                      <td className="border border-gray-700">{molaSebebi.stop_reason_name}</td>
                      <td className="border border-gray-700">{currentDate}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
  
            {/* Butonlar */}
            <div className="w-full h-[15%] flex items-center justify-evenly mt-3">
              {buttons.map((item, index) => (
                <Button
                key={index}
                className={item.className}
                children={item.children}
                onClick={item.onClick}
              />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
}

export default StopJobPopup;
