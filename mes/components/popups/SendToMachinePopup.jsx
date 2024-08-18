import React, { useEffect } from "react";
import Button from "../ui/Button";
import { handleGetGroupList, fetchBuzlamaWorks, setSelectedProcess, setSelectedMachine } from "@/redux/orderSlice";
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
  } = useSelector((state) => state.order);
  const pathName = usePathname();
  const areaName = pathName.split("/")[3];
  const { userInfo } = useSelector((state) => state.user);

  useEffect(() => {
    dispatch(handleGetGroupList());
    dispatch(fetchBuzlamaWorks({ areaName }));
  }, [dispatch]);

  const handleOrderFilteredByGroup = (group_no) => {
    let updatedSelectedGroupNo = [];
    if (selectedGroupNo.includes(group_no)) {
      // Grup zaten seçiliyse, kaldır
      updatedSelectedGroupNo = selectedGroupNo.filter((no) => no !== group_no);
    } else {
      // Grup seçili değilse, ekle
      updatedSelectedGroupNo = [...selectedGroupNo, group_no];
    }
    // Seçili gruplara ait order_id'leri yeniden hesapla
    let newFilteredGroup = [];
    updatedSelectedGroupNo.forEach((no) => {
      const ordersForGroup = buzlamaWork.filter(
        (order) => order.group_no === no
      );
      newFilteredGroup = [
        ...newFilteredGroup,
        ...ordersForGroup.map((order) => order.order_no),
      ];
    });

    dispatch(setSelectedGroupNos(updatedSelectedGroupNo));
    dispatch(setFilteredGroup(newFilteredGroup));
  };

  //! Makineye sipariş gönderme (başlatma) fonksiyonu...
  const handleSendToMachine = async () => {
    const groupNo = selectedGroupNo[0]; // Sadece ilk grup numarasını alıyoruz
    const id_dec = userInfo && userInfo.id_dec;
    try {
      if (selectedGroupNo.length > 1) {
        toast.error("Makineye göndermek için sadece bir grup seçiniz");
      } else {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/sendToMachine`,
          {
            group_no: groupNo, // Artık JSON değil direkt string
            machine_name:selectedMachine.machine_name,
            process_name:selectedProcess?.process_name,
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
      if(err.response.status === 404){
        toast.error(err.response.data);
      }
    }
  };

  // makineye gönder popup ını acacak fonksıyon...
  const handleOpenSendMachinePopup = () => {
    dispatch(setSendToMachinePopup(false));
  };

  const buttons = [
    {
      children: "Kapat",
      type: "button",
      className:
        "w-[150px] h-[100px] bg-red-500 hover:bg-red-600 sm:py-2 text-md",
      onClick: handleOpenSendMachinePopup,
    },
    {
      children: "Makineye Gönder",
      type: "button",
      className: "w-[150px] h-[100px] sm:py-2 text-md",
      onClick: handleSendToMachine,
    },
  ];
  return (
    <div className="w-screen h-screen top-0 left-0 absolute text-black font-semibold">
      <div className="flex items-center justify-center w-full h-full  ">
        <div className="md:w-[1000px] w-[800px] h-[600px] bg-black border-2 border-white p-3 static z-50 rounded-md ">
          {/* Header kısmı 20% */}
          <div className="h-[20%] w-full bg-secondary">
            <div className="w-full h-full flex items-center justify-center">
              <h1 className="text-[40px] font-semibold">
                Makineye Göndereceğiniz Grubu Seçin
              </h1>
            </div>
          </div>
          {/* 80% */}
          <div className="h-[60%] w-full mt-1 bg-black ">
            <div className="flex justify-between w-full h-full gap-x-1 ">
              {/* w-1/2 */}
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
                            handleOrderFilteredByGroup(item.group_no)
                          }
                          className={`w-full py-3 px-2 shadow-md border-b cursor-pointer hover:bg-slate-200 ${
                            selectedGroupNo.includes(item.group_no)
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
              {/* w-1/2 */}
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
                          {item}
                        </ol>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* buttons area */}
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
