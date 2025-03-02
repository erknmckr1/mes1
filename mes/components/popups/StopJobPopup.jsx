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
      type: "button",
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
    <div className="w-screen h-screen top-0 left-0 absolute text-black font-semibold">
      <div className="flex items-center justify-center w-full h-full  ">
        <div className="md:w-[1300px] w-[800px] h-[600px] bg-black border-2 border-white p-3 static z-50 rounded-md ">
          {/* Header kısmı 20% */}
          <div className="h-[20%] w-full bg-white"></div>
          {/* 80% */}
          <div className="h-[80%] w-full mt-1 bg-gray-100 ">
            <div className="flex gap-x-2 h-full ">
              {/* iptal sebebleri */}
              <div className="w-[30%] h-full border relative p-2">
                <div className="w-full h-full flex flex-col ">
                  <span className="absolute bg-secondary text-center w-full border-b border-black py-4 font-bold text-[25px]">
                    {stopReasonPopup.actionType === "order"
                      ? " Siparişi Durdurma Sebepleri"
                      : "Grup Durdurma Sebepleri"}
                  </span>
                  <div className="w-full h-full flex flex-col overflow-x-scroll mt-16">
                    {stopReason &&
                      stopReason.map((item) => (
                        <span
                          key={item.stop_reason_name}
                          className={`py-[15px] text-[20px] cursor-pointer hover:text-white hover:bg-gray-600  text-center border-b border-black 
                           ${
                             molaSebebi.stop_reason_name ===
                             item.stop_reason_name
                               ? "bg-green-600 text-white"
                               : ""
                           }`}
                          onClick={() => setMolaSebebii(item)}
                        >
                          {item.stop_reason_name}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
              <div className="w-[70%] h-full border text-white p-2">
                <div className="w-full h-full flex flex-col">
                  {/* w-75% -> h-85,15  */}
                  <div className="w-full h-[85%] bg-black">
                    <table className="w-full p-2">
                      <thead className="bg-secondary text-[20px] text-black font-semibold overflow-x-scroll">
                        <tr className="w-full text-center">
                          {sutunİsimleri.map((item, index) => (
                            <td
                              key={index}
                              className=" p-2  text-center border"
                            >
                              {item}
                            </td>
                          ))}
                        </tr>
                      </thead>
                      {areaName === "kalite" && (
                        <tbody className="p-3">
                          <tr className="bg-gray-100 h-16 text-black text-[23px]">
                            <th>{userInfo && userInfo.id_dec}</th>
                            <th>{userInfo && userInfo.op_name}</th>
                            <th>{molaSebebi.stop_reason_name}</th>
                            <th>{currentDate}</th>
                          </tr>
                        </tbody>
                      )}
                      {(areaName === "buzlama" || areaName === "cekic" || areaName === "kurutiras") && (
                        <tbody className="p-3">
                          <tr className="bg-gray-100 h-16 text-black text-[23px]">
                            <th>{user && user.id_dec}</th>
                            <th>{user && user.op_name}</th>
                            <th>{molaSebebi.stop_reason_name}</th>
                            <th>{currentDate}</th>
                          </tr>
                        </tbody>
                      )}
                    </table>
                  </div>
                  <div className="w-full h-[15%] ">
                    <div className="w-full h-full flex items-center gap-20 justify-evenly">
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
          </div>
        </div>
      </div>
      <div className="w-screen h-screen absolute bg-black opacity-85 top-0 left-0"></div>
    </div>
  );
}

export default StopJobPopup;
