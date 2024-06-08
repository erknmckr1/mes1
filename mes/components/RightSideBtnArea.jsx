import React from "react";
import Button from "./uı/Button";
import { useSelector } from "react-redux";
import { setStopReasonPopup,cancelReasonPopup, setCancelReasonPopup,setRepairJobPopup } from "@/redux/orderSlice";
import { useDispatch } from "react-redux";

function RightSideBtnArea() {
  const { onBreak_users, loading, error, isCurrentBreak } = useSelector(
    (state) => state.break
  );
  const stopReasonPopup = useSelector((state) => state.order.stopReasonPopup);
  const repairJobPopup = useSelector((state) => state.order.repairJobPopup);
  console.log(repairJobPopup)
  const dispatch = useDispatch();
 
  const buttons_r = [
    {
      onClick: () => {
        dispatch(setStopReasonPopup(true));
      },
      children: "Siparişi Durdur",
      type: "button",
      className: "w-[200px]",
      disabled: isCurrentBreak,
    },
    {
      onClick: "",
      children: "Yeniden Başlat",
      type: "button",
      className: "w-[200px]",
      disabled: isCurrentBreak,
    },
    {
      onClick: "",
      children: "Prosesi Bitir",
      type: "button",
      className: "w-[200px]",
      disabled: isCurrentBreak,
    },
    {
      onClick: "",
      children: "Parçalı Bitir",
      type: "button",
      className: "w-[200px]",
      disabled: isCurrentBreak,
    },
    {
      onClick: ()=>{dispatch(setCancelReasonPopup(true))},
      children: "Sipariş İptal",
      type: "button",
      className: "w-[200px] bg-red-600",
      disabled: isCurrentBreak,
    },
    {
      onClick: ()=>{dispatch(setRepairJobPopup(true))},
      children: "Tamire Yolla",
      type: "button",
      className: "w-[200px]",
      disabled: isCurrentBreak,
    },
    // {
    //   onClick: "",
    //   children: "Ölçüm Veri Girişi",
    //   type: "button",
    //   className: "w-[200px]",
    //   disabled: isCurrentBreak,
    // },
  ];
  return (
    <div className="flex flex-col gap-y-5 items-center  justify-center">
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
