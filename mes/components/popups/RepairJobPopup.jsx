import React from "react";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { setRepairJobPopup } from "@/redux/orderSlice";
import { usePathname } from "next/navigation";
import axios from "axios";
import { useState, useEffect } from "react";
import Button from "../uı/Button";

function RepairJobPopup() {
  const dispatch = useDispatch();
  const userInfo = useSelector((state) => state.user.userInfo);
  const pathname = usePathname();
  const pageName = pathname.split("/")[2]; // URL'den sayfa ismini alır
  const [repairReason, setRepairReason] = useState(null);
  const [tamirSebebi, setTamirSebebi] = useState("");

  const getRepairReason = async () => {
    try {
      const result = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/getRepairReason`,
        { params: { area_name: pageName } } // get metodu ıle parametre yolluyorsan params ı kullan. 
      );
      setRepairReason(result.data);
      return result.data;
    } catch (err) {
      console.error("Error fetching break reasons:", err);
    }
  };

  useEffect(() => {
    getRepairReason();
  }, []);

console.log(repairReason)
  const buttons = [
    {
      onClick: () => {
        dispatch(setRepairJobPopup(false));
      },
      children: "Vazgeç",
      type: "button",
      className: "",
    },
    {
      onClick: ()=>{dispatch(setRepairJobPopup(false))},
      children: "Tamire Yolla",
      type: "button",
      className: "bg-red-600 hover:bg-red-500",
    },
  ];
  const sutunİsimleri = [
    "Operator ID",
    "Operator",
    "Tamir Sebebi",
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
                    Tamir Sebebleri
                  </span>
                  <div className="w-full h-full flex flex-col overflow-x-scroll mt-16">
                    {repairReason &&
                      repairReason.map((item) => (
                        <span
                          key={item.repair_reason_id}
                          className={`py-[15px] text-[20px] cursor-pointer hover:text-white hover:bg-gray-600  text-center border-b border-black 
                           ${
                             tamirSebebi === item.repair_reason
                               ? "bg-green-600 text-white"
                               : ""
                           }`}
                          onClick={() =>
                            setTamirSebebi(item.repair_reason)
                          }
                        >
                          {item.repair_reason}
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
                      <tbody className="p-3">
                        <tr className="bg-gray-100 h-16 text-black text-[23px]">
                          <th>{userInfo && userInfo.id_dec}</th>
                          <th>{userInfo && userInfo.op_name}</th>
                          <th>{tamirSebebi}</th>
                          <th>{currentDate}</th>
                        </tr>
                      </tbody>
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

export default RepairJobPopup;
