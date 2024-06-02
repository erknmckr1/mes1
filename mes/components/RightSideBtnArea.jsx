import React from "react";
import Button from "./uı/Button";
function RightSideBtnArea() {
  const buttons_r = [
    {
      onClick: "",
      children: "Siparişi Durdur",
      type: "button",
      className: "w-[200px]",
    },
    {
      onClick: "",
      children: "Yeniden Başlat",
      type: "button",
      className: "w-[200px]",
    },
    {
      onClick: "",
      children: "Prosesi Bitir",
      type: "button",
      //   className: `${
      //     filteredUser()
      //       ? "bg-gray-600 hover:bg-gray-600 w-[200px]"
      //       : "bg-red-500 hover:bg-red-600 w-[200px]"
      //   }`,
    },
    {
      onClick: "",
      children: "Parçalı Bitir",
      type: "button",
      className: "w-[200px]",
    },
    {
      onClick: "",
      children: "Ölçüm Veri Girişi",
      type: "button",
      className: "w-[200px]",
    },
  ];
  return (
    <div className="flex flex-col gap-y-5 items-center pt-5 justify-center">
      {buttons_r.map((button, index) => (
        <Button
          key={index}
          className={button.className}
          children={button.children}
          type={button.type}
          onClick={button.onClick}
          // disabled={filteredUser()}
        />
      ))}
    </div>
  );
}

export default RightSideBtnArea;
