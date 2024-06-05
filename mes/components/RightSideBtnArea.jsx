import React from "react";
import Button from "./uı/Button";
import { useSelector } from "react-redux";

function RightSideBtnArea() {
  const { onBreak_users, loading, error,isCurrentBreak } = useSelector((state) => state.break);
  const filteredUser = () => {
    console.log(isCurrentBreak)
  }
  const buttons_r = [
    {
      onClick: "",
      children: "Siparişi Durdur",
      type: "button",
      className: "w-[200px]",
      disabled:isCurrentBreak
    },
    {
      onClick: "",
      children: "Yeniden Başlat",
      type: "button",
      className: "w-[200px]",
      disabled:isCurrentBreak
    },
    {
      onClick: "",
      children: "Prosesi Bitir",
      type: "button",
      className: "w-[200px]",
      disabled:isCurrentBreak
    },
    {
      onClick: "",
      children: "Parçalı Bitir",
      type: "button",
      className: "w-[200px]",
      disabled:isCurrentBreak
    },
    {
      onClick: "",
      children: "Ölçüm Veri Girişi",
      type: "button",
      className: "w-[200px]",
      disabled:isCurrentBreak
    },
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
