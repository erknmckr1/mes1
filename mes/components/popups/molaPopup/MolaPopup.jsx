import React from "react";
import Button from "../../ui/Button";
import { useSelector } from "react-redux";
import { useBreakPopupLogic } from "./useBreakPopupLogic";
import { usePathname } from "next/navigation";

function MolaPopup() {
  const {
    createBreakFunc,
    molaReason,
    araSebebi,
    closeMolaPopup,
    setAraSebebi,
  } = useBreakPopupLogic();

  const { userInfo, user } = useSelector((state) => state.user);
  const { theme, isRequiredUserId } = useSelector((state) => state.global);
  const pathname = usePathname();
  const areaName = pathname.split("/")[3];

  const buttons = [
    {
      onClick: closeMolaPopup,
      children: "Vazgeç",
      type: "button",
      className: "",
    },
    {
      onClick: createBreakFunc,
      children: "Araya Cik",
      type: "submit",
      className: "bg-red-600 hover:bg-red-500",
    },
  ];

  const sutunİsimleri = [
    "Operator ID",
    "Operator",
    "Molaya Çikiş Sebebi",
    "Molaya Çikiş Saati",
  ];

  const currentDate = new Date().toLocaleString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return (
    <div
      className={`w-screen h-screen top-0 left-0 absolute flex items-center justify-center bg-black bg-opacity-75 z-50 ${
        theme === "dark" ? "dark-mode" : "light-mode"
      }`}
    >
      <div className="md:w-[1200px] w-[800px] h-[600px] popup-content shadow-2xl rounded-xl p-6">
        {/* Header - 20% */}
        <div className="h-[20%] popup-header w-full font-bold text-xl flex items-center justify-center rounded-t-xl shadow-md">
          Molaya Çıkma Sebebi
        </div>

        {/* İçerik Alanı - 80% */}
        <div className="h-[80%] w-full mt-1 p-2 rounded-b-xl flex">
          {/* Sebep Listesi */}
          <div className="w-[30%] h-full border-r popup-table p-2 flex flex-col">
            <div className="overflow-y-auto flex flex-col gap-2 mt-2">
              {molaReason &&
                molaReason.map((item) => (
                  <span
                    key={item.break_reason_id}
                    className={`py-3 text-lg cursor-pointer text-center border rounded-md transition-all duration-300
                      ${
                        araSebebi === item.break_reason_id
                          ? "bg-green-600 text-white"
                          : "popup-item hover:bg-opacity-75"
                      }`}
                    onClick={() => setAraSebebi(item.break_reason_id)}
                  >
                    {item.break_reason}
                  </span>
                ))}
            </div>
          </div>

          {/* Tablo Alanı */}
          <div className="w-[70%] h-full flex flex-col px-2">
            <div className="w-full h-[85%] popup-table rounded-lg p-3 shadow-md">
              <table className="w-full rounded-md overflow-hidden">
                <thead className="popup-table-header text-lg font-semibold">
                  <tr>
                    {sutunİsimleri.map((item, index) => (
                      <th key={index} className="p-2 border">
                        {item}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-lg text-center popup-table-body">
                  <tr className="h-16 text-xl">
                    <td className="border">
                      {isRequiredUserId
                        ? user && user.id_dec
                        : userInfo && userInfo.id_dec}
                    </td>
                    <td className="border">
                      {isRequiredUserId || areaName === "kalite"
                        ? user && user.op_username
                        : userInfo && userInfo.op_username}
                    </td>
                    <td className="border">{araSebebi}</td>
                    <td className="border">{currentDate}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Butonlar */}
            <div className="w-full h-[15%] flex items-center justify-evenly mt-3">
              {buttons.map((item, index) => (
                <Button
                  key={index}
                  onClick={item.onClick}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-md popup-button
                    ${
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
      </div>
    </div>
  );
}

export default MolaPopup;
