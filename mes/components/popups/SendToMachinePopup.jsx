import React, { useEffect } from "react";
import Button from "../ui/Button";
import {
  handleGetGroupList,
  fetchBuzlamaWorks,
  setSelectedProcess,
  setSelectedMachine,
} from "@/redux/orderSlice";
import { useDispatch, useSelector } from "react-redux";
import {
  setSelectedGroupNos,
  setFilteredGroup,
  setSendToMachinePopup,
} from "@/redux/orderSlice";
import axios from "axios";
import { toast } from "react-toastify";
import { getWorkList } from "@/api/client/cOrderOperations";
import { usePathname } from "next/navigation";

function SendToMachinePopup() {
  const dispatch = useDispatch();
  const {
    groupList,
    selectedGroupNo,
    buzlamaWork,
    filteredGroup,
    selectedProcess,
    selectedMachine,
    actionType,
  } = useSelector((state) => state.order);
  const pathName = usePathname();
  const areaName = pathName.split("/")[3];
  const { userInfo } = useSelector((state) => state.user);

  //! grupları ve bolumdekı işleri çek...
  useEffect(() => {
    dispatch(handleGetGroupList());
    dispatch(fetchBuzlamaWorks({ areaName }));
  }, [dispatch]);

  // Seçilen grup zaten mevcutsa listeden çıkar, değilse listeye ekle Güncellenmiş grup ve sipariş listesini state'e kaydet
  const handleOrderFilteredByGroup = ({ group_record_id, group_status }) => {
    let updatedSelectedGroupNo = [];

    // Eğer grup zaten seçiliyse, onu kaldırıyoruz
    if (
      selectedGroupNo.some((group) => group.group_record_id === group_record_id)
    ) {
      updatedSelectedGroupNo = selectedGroupNo.filter(
        (group) => group.group_record_id !== group_record_id
      );
    } else {
      // Grup seçili değilse, onu ekliyoruz
      updatedSelectedGroupNo = [
        ...selectedGroupNo,
        { group_record_id, group_status },
      ];
    }

    // Seçili gruplara ait order_id'leri ve uniq_id'leri yeniden hesapla
    let newFilteredGroup = [];
    updatedSelectedGroupNo.forEach((group) => {
      const ordersForGroup = buzlamaWork.filter(
        (order) => order.group_record_id === group.group_record_id
      );
      newFilteredGroup = [
        ...newFilteredGroup,
        ...ordersForGroup.map((order) => ({
          order_no: order.order_no,
          uniq_id: order.uniq_id,
        })),
      ];
    });

    // newFilteredGroup şimdi hem order_no, uniq_id hem de group_status içerecek
    dispatch(setSelectedGroupNos(updatedSelectedGroupNo));
    dispatch(setFilteredGroup(newFilteredGroup));
  };

  console.log({
    selectedGroupNo: selectedGroupNo,
    filteredGroup: filteredGroup,
    groupList: groupList,
  });

  //! Makineye sipariş gönderme (başlatma) fonksiyonu...
  const handleSendToMachine = async () => {
    const group = selectedGroupNo[0]; // Sadece ilk grup numarasını alıyoruz
    const id_dec = userInfo && userInfo.id_dec;
    try {
      if (selectedGroupNo.length > 1 || selectedGroupNo.length === 0) {
        toast.error("Makineye göndermek için sadece bir grup seçiniz");
      } else {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/sendToMachine`,
          {
            group_record_id: group.group_record_id, // Artık JSON değil direkt string
            machine_name: selectedMachine.machine_name,
            process_name: selectedProcess?.process_name,
            process_id: selectedProcess?.process_id,
            id_dec,
          }
        );

        if (response.status === 200) {
          toast.success("Gruba gönderme işlemi başarılı...");
          getWorkList({
            areaName,
            userId: userInfo.id_dec,
            dispatch,
          });
          dispatch(setSelectedGroupNos([]));
          dispatch(setFilteredGroup([]));
          dispatch(setSendToMachinePopup(false));
          dispatch(setSelectedProcess(""));
          dispatch(setSelectedMachine(""));
        } else {
          toast.error(
            response.data.message || "İşlem sırasında bir hata oluştu."
          );
        }
      }
    } catch (err) {
      console.log(err);
      if (err.response.status === 404) {
        toast.error(err.response.data);
      }
    }
  };

  //! Seçili grubtaki işleri bitirme fonksiyonu...
  const handleFinishGroup = async () => {
    const orders = JSON.stringify(filteredGroup);
    const groups = JSON.stringify(selectedGroupNo);
    const id_dec = userInfo && userInfo.id_dec;
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/finishTheGroup`,
        {
          orders,
          groups,
          id_dec,
        }
      );

      if (response.status === 200) {
        toast.success(response.data);
        getWorkList({
          areaName,
          userId: userInfo.id_dec,
          dispatch,
        });
        dispatch(setSelectedGroupNos([]));
        dispatch(setFilteredGroup([]));
        dispatch(setSendToMachinePopup(false));
        dispatch(setSelectedProcess(""));
        dispatch(setSelectedMachine(""));
      } else {
        toast.error(
          response.data.message || "İşlem sırasında bir hata oluştu."
        );
      }
    } catch (err) {
      if (err) {
        toast.error(err.response?.data);
        console.log(err);
      }
    }
  };

  const handleAction = () => {
    if (actionType === "send") {
      handleSendToMachine();
    } else if (actionType === "finish") {
      handleFinishGroup();
    }
  };

  // popup ı kapat...
  const handleClosedPopup = () => {
    dispatch(setSendToMachinePopup({ visible: false, actionType: "" })); // Popup'ı kapatıyoruz
    dispatch(setSelectedGroupNos([]));
    dispatch(setSelectedMachine(""));
    dispatch(setSelectedProcess(""));
  };

  const buttons = [
    {
      children: "Kapat",
      type: "button",
      className:
        "w-[150px] h-[100px] bg-red-500 hover:bg-red-600 sm:py-2 text-md",
      onClick: handleClosedPopup,
    },
    {
      children: actionType === "send" ? "Makineye Gönder" : "Grubu Bitir",
      type: "button",
      className: "w-[150px] h-[100px] sm:py-2 text-md",
      onClick: handleAction,
    },
  ];
  return (
    <div className="w-screen h-screen top-0 left-0 absolute text-black font-semibold">
      <div className="flex items-center justify-center w-full h-full  ">
        <div className="md:w-[1000px] w-[800px] h-[600px] bg-black border-2 border-white p-3 static z-50 rounded-md ">
          {/* Header kısmı */}
          <div className="h-[20%] w-full bg-secondary">
            <div className="w-full h-full flex items-center justify-center">
              <h1 className="text-[40px] font-semibold">
                {actionType === "send"
                  ? "Makineye Göndereceğiniz Grubu Seçin"
                  : "Bitireceğiniz Grubu Seçin"}
              </h1>
            </div>
          </div>
          {/* Grup listesi ve seçili grup */}
          <div className="h-[60%] w-full mt-1 bg-black ">
            <div className="flex justify-between w-full h-full gap-x-1 ">
              <div className="w-1/2 h-full bg-gray-100">
                <div className="flex flex-col h-full w-full">
                  <span className="h-[15%] border-b border-black text-lg flex items-center justify-center py-1">
                    Grup Listesi
                  </span>
                  <div className=" h-[85%] w-full ">
                    <ul className="w-full h-full overflow-y-auto">
                      {groupList?.map((item, index) => (
                        <ol
                          onClick={() =>
                            handleOrderFilteredByGroup({
                              group_record_id: item.group_record_id,
                              group_status: item.group_status,
                            })
                          }
                          className={`w-full py-3 px-2 shadow-md border-b cursor-pointer hover:bg-slate-200 ${
                            item.group_status === "2"
                              ? "bg-red-100 hover:bg-red-100"
                              : ""
                          } ${
                            selectedGroupNo.some(
                              (sgroup) =>
                                sgroup.group_record_id === item.group_record_id
                            )
                              ? "bg-slate-300"
                              : ""
                          }`}
                          key={index}
                        >
                          {item.group_no}
                        </ol>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              <div className="w-1/2 h-full bg-gray-100">
                <div className="flex flex-col h-full w-full">
                  <span className="h-[15%] border-b border-black text-lg flex items-center justify-center py-1">
                    Seçili Grup İçerisindeki Siparişler
                  </span>
                  <div className="h-[85%] w-full  ">
                    <ul className="w-full h-full overflow-y-auto">
                      {filteredGroup?.map((item, index) => (
                        <ol
                          className={`w-full py-3 px-2 shadow-md border-b  `}
                          key={index}
                        >
                          {item.order_no}
                        </ol>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Buttons */}
          <div className="h-[20%] w-full mt-1 bg-gray-100 flex items-center justify-center gap-x-10 ">
            {buttons.map((item, index) => (
              <Button
                className={item.className}
                type={item.type}
                children={item.children}
                key={index}
                onClick={item.onClick}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="w-screen h-screen absolute bg-black opacity-85 top-0 left-0"></div>
    </div>
  );
}

export default SendToMachinePopup;
