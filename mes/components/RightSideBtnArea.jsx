import React from "react";
import Button from "./uı/Button";
import { useSelector } from "react-redux";
import {
  setStopReasonPopup,
  cancelReasonPopup,
  setCancelReasonPopup,
  setRepairJobPopup,
  setFinishedWorkPopup,
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
  const { stopReasonPopup, selectedOrder } = useSelector(
    (state) => state.order
  );
  const { userInfo } = useSelector((state) => state.user);

  const dispatch = useDispatch();
  const pathName = usePathname();
  const areaName = pathName.split("/")[2];

  //! stop popup ı ac
  const handleOpenStopPopup = () => {
    if (selectedOrder && selectedOrder.work_status === "1") {
      dispatch(setStopReasonPopup(true));
    } else {
      toast.error("İşleme devam etmek için aktif bir iş seçin");
    }
  };
 
  //! Seçili ve durdurulmus siparişi yeniden baslat...
  const restartWork = async () => {
    try {
      if (selectedOrder && selectedOrder.work_status === "2") {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/restartWork`,
          {
            work_log_uniq_id: selectedOrder.uniq_id,
          }
        );

        if (response.status === 200) {
          getWorkList(areaName, dispatch);
          toast.success("Tekrardan başlatma işlemi başarılı.");
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
      selectedOrder &&
      selectedOrder?.work_status === "1" ||
      selectedOrder?.work_status === "2"
    ) {
      dispatch(setFinishedWorkPopup(true))
    }else{
      toast.error("Durduracağiniz prosesi seçiniz.")
    }
  };

  const handleOpenCancelPopup = () => {
    if (
      selectedOrder &&
      selectedOrder?.work_status === "1" ||
      selectedOrder?.work_status === "2"
    ) {
      dispatch(setCancelReasonPopup(true))
    }else{
      toast.error("İptal edeceginiz prosesi seçiniz.")
    }
  }

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
      onClick: handleOpenCancelPopup,
      children: "Sipariş İptal",
      type: "button",
      className: "w-[200px] bg-red-600",
      disabled: isCurrentBreak,
    },
  ];
  return (
    <div className="flex flex-col gap-y-5 ">
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
}

export default RightSideBtnArea;
