import React from "react";
import Button from "./ui/Button";
import { useSelector } from "react-redux";
import {
  setStopReasonPopup,
  setFinishedWorkPopup,
  setSelectedOrder,
  setOrderGroupManagement,
  setSendToMachinePopup,
  setMeasurementPopup
} from "@/redux/orderSlice";

import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import axios from "axios";
import { getWorkList } from "@/api/client/cOrderOperations";
import { usePathname } from "next/navigation";

function RightSideBtnArea() {
  const { onBreak_users, loading, error, isCurrentBreak } = useSelector(
    (state) => state.break
  );
  const { stopReasonPopup, selectedOrder,groupManagementPopup,sendToMachinePopup,selectedProcess,selectedMachine } = useSelector(
    (state) => state.order
  );
  const { userInfo } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const pathName = usePathname();
  const areaName = pathName.split("/")[3];

  //! stop popup ı ac
  const handleOpenStopPopup = () => {
    if (selectedOrder && selectedOrder.work_status === "1") {
      dispatch(setStopReasonPopup(true));
    } else {
      toast.error("İşleme devam etmek için aktif bir iş seçin");
    }
  };

  const handleOpenGroupManagementPopup = () => {
    dispatch(setOrderGroupManagement(true));
  }

  //! Seçili ve durdurulmus siparişi yeniden baslat...
  const restartWork = async () => {
    try {
      if (selectedOrder && selectedOrder.work_status === "2") {
        if (confirm("İş tekrardan baslatilsin mi ? ")) {
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/restartWork`,
            {
              work_log_uniq_id: selectedOrder.uniq_id,
              currentUser: userInfo.id_dec,
              startedUser: selectedOrder.user_id_dec,
              selectedOrder,
            }
          );

          if (response.status === 200) {
            getWorkList({ areaName, userId: userInfo.id_dec, dispatch });
            toast.success("Tekrardan başlatma işlemi başarılı.");
            dispatch(setSelectedOrder(null));
          }
        }
      } else {
        toast.error("Durdurulmuş bir iş seçiniz...");
      }
    } catch (err) {
      console.log(err);
      toast.error("İşlem başarısız oldu.");
    }
  };

  const handleOpenFinishedPopup = () => {
    if (
      (selectedOrder && selectedOrder?.work_status === "1") ||
      selectedOrder?.work_status === "2"
    ) {
      dispatch(setFinishedWorkPopup(true));
    } else {
      toast.error("Durduracağiniz prosesi seçiniz.");
    }
  };

  //! Bir siparişi iptal edecek popup
  const handleCancelWork = async () => {
    try {
      if (selectedOrder) {
        if (confirm("Sipariş iptal edilsin mi ?")) {
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/cancelWork`,
            {
              uniq_id: selectedOrder.uniq_id,
              currentUser: userInfo.id_dec,
            }
          );
          if (response.status === 200) {
            toast.success(
              `${selectedOrder?.uniq_id} numaralı sipariş iptal edildi...`
            );
            dispatch(setSelectedOrder(null));
            getWorkList({ areaName, userId: userInfo.id_dec, dispatch });
          }
        }
      }
    } catch (err) {
      console.log(err);
      toast.error("Sipariş iptal edilemedi. Lütfen tekrar deneyin.");
    }
  };

  // makineye gönder popup ını acacak fonksıyon... 
  const handleOpenSendMachinePopup = () => {
    if(selectedProcess && selectedMachine){
      dispatch(setSendToMachinePopup(true));
    };
  }

  // ölçüm veri girişi popup ını açacak fonksıyon...
  const handleOpenMeasurementPopup = () => {
    dispatch(setMeasurementPopup(true));
  }

  // Kalite buttons
  const buttons_r = [
    {
      onClick: handleOpenStopPopup,
      children: "Siparişi Durdur",
      type: "button",
      className: "w-[200px]",
      disabled: isCurrentBreak,
    },
    {
      onClick: restartWork,
      children: "Yeniden Başlat",
      type: "button",
      className: "w-[200px]",
      disabled: isCurrentBreak,
    },
    {
      onClick: handleOpenFinishedPopup,
      children: "Prosesi Bitir",
      type: "button",
      className: "w-[200px]",
      disabled: isCurrentBreak,
    },
    {
      onClick: handleCancelWork,
      children: "Sipariş İptal",
      type: "button",
      className: "w-[200px] bg-red-600",
      disabled: isCurrentBreak,
    },
  ];
  // buzlama da kullanılan btn...
  const buttons_rtwo = [
    {
      onClick: handleOpenGroupManagementPopup,
      children: "Grup Yönetimi",
      type: "button",
      className: "w-[150px] sm:px-1 sm:py-5  text-sm",
      disabled: isCurrentBreak,
    },
    {
      onClick: handleOpenSendMachinePopup,
      children: "Makineye Gönder",
      type: "button",
      className: "w-[150px] sm:px-1 sm:py-5  text-sm",
      disabled: isCurrentBreak,
    },
    {
      onClick: handleOpenStopPopup,
      children: "Siparişi Durdur",
      type: "button",
      className: "w-[150px] sm:px-1 sm:py-5  text-sm",
      disabled: isCurrentBreak,
    },
    {
      onClick: restartWork,
      children: "Yeniden Başlat",
      type: "button",
      className: "w-[150px] sm:px-1 sm:py-5  text-sm",
      disabled: isCurrentBreak,
    },
    {
      onClick: handleOpenFinishedPopup,
      children: "Prosesi Bitir",
      type: "button",
      className: "w-[150px] sm:px-1 sm:py-5  text-sm",
      disabled: isCurrentBreak,
    },
    {
      onClick: handleOpenFinishedPopup,
      children: "Grubu Teslim  Et",
      type: "button",
      className: "w-[150px] sm:px-1 sm:py-5  text-sm",
      disabled: isCurrentBreak,
    },
    {
      onClick: handleOpenFinishedPopup,
      children: "Seçilenleri Ş. Bitir",
      type: "button",
      className: "w-[150px] sm:px-1 sm:py-5  text-sm ",
      disabled: isCurrentBreak,
    },
    {
      onClick: handleOpenStopPopup,
      children: "Seçilenleri Bitir",
      type: "button",
      className: "w-[150px] sm:px-1 sm:py-5  text-sm",
      disabled: isCurrentBreak,
    },
    {
      onClick: handleCancelWork,
      children: "Sipariş İptal",
      type: "button",
      className: "w-[150px] sm:px-1 sm:py-5  text-sm  text-sm bg-red-600 hover:bg-red-500",
      disabled: isCurrentBreak,
    },
    {
      onClick: handleCancelWork,
      children: "Ölçüm V. Girişi",
      type: "button",
      className: "w-[150px] sm:px-1 sm:py-5  text-sm  text-sm bg-orange-500 hover:bg-orange-600",
      disabled: isCurrentBreak,
      onClick:handleOpenMeasurementPopup
    },
  ];

  //? Route gore section un sağ tarafına farklı yapıda render edecegız.
  const renderButtons = () => {
    if (areaName === "kalite" || areaName === "kurutiras") {
      return (
        <div className="w-full flex flex-col gap-y-5 justify-center items-center ">
          {buttons_r.map((button, index) => (
            <Button
              key={index}
              className={button.className}
              children={button.children}
              type={button.type}
              onClick={button.onClick}
              disabled={isCurrentBreak}
            />
          ))}
        </div>
      );
    } else {
      // Diğer areaName'ler için farklı yapı döndürebilirsiniz.
      return (
        <div className="">
          <div className="w-full grid grid-cols-2 gap-1">
            {buttons_rtwo.map((button, index) => (
              <Button
                key={index}
                className={button.className}
                children={button.children}
                type={button.type}
                onClick={button.onClick}
                disabled={isCurrentBreak}
              />
            ))}
          </div>
        </div>
      );
    }
  };

  return renderButtons();
}

export default RightSideBtnArea;
