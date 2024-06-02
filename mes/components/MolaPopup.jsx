import React from "react";
import axios from "axios";
import { useState, useEffect } from "react";
import Button from "./uı/Button";
import { useSelector } from "react-redux";
import { setMolaPopup } from "@/redux/globalSlice";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { usePathname } from "next/navigation";
import { fetchOnBreakUsers } from "@/redux/breakOperationsSlice";
function MolaPopup() {
  const dispatch = useDispatch();
  const [molaReason, setMolaReason] = useState(null);
  const [araSebebi, setAraSebebi] = useState("");
  const userInfo = useSelector((state) => state.user.userInfo);
  const pathname = usePathname();
  const pageName = pathname.split("/")[1];

 
  // popup ın durumnu kontrol eden state (acık kapalı)
  const closeMolaPopup = () => {
    dispatch(setMolaPopup(false));
    setAraSebebi("");
  };

  //! Ara sebeplerini getiren metot
  const getOzelAraReason = async () => {
    try {
      const getReason = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/breakReason`);
      if (getReason.status === 200) {
        setMolaReason(getReason.data);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getOzelAraReason();
  }, []);

  //! Özel ara oluşturmak için gerekli fonksıyon, servis fonksıoyonlarının renkleri kırmızı renkte
  //! Kullanıcı hangı sayfada araya cıkıyorsa tabloda main_section ona gore dolduruluyor.
  const createBreak = async (userInfo, araSebebi) => {
    if (!araSebebi) {
      toast.error("Ara sebebini seçmeden işlem yapamazsınız.");
      return;
    }
    const startLog = {
      break_reason_id: araSebebi,
      operator_id: userInfo.id_dec,
      area_name: pageName,
    };

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/createBreak`,
        startLog
      );
      if (response.status === 200) {
        await dispatch(fetchOnBreakUsers());
        toast.success(`${userInfo.operator_fullname} için mola oluşturuldu.`);
        dispatch(setMolaPopup(false));
      } else {
        toast.error("Bir hata oluştu. Lütfen tekrar deneyin.");
      }
    } catch (err) {
      toast.error("Bir hata oluştu. Lütfen tekrar deneyin.");
      console.log(err);
    }
  };


  const buttons = [
    {
      onClick: closeMolaPopup,
      children: "Vazgeç",
      type: "button",
      className: "",
    },
    {
      onClick: () => createBreak(userInfo, araSebebi),
      children: "Araya Cik",
      type: "button",
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
    <div className="w-screen h-screen top-0 left-0 absolute text-black font-semibold">
      <div className="flex items-center justify-center w-full h-full  ">
        <div className="md:w-[1200px] w-[800px] h-[600px] bg-black border-2 border-white p-3 static z-50 rounded-md ">
          {/* Header kısmı 20% */}
          <div className="h-[20%] w-full bg-white"></div>
          {/* 80% */}
          <div className="h-[80%] w-full mt-1 bg-gray-100 ">
            <div className="flex gap-x-2 h-full ">
              {/* iptal sebebleri */}
              <div className="w-[30%] h-full border relative p-2">
                <div className="w-full h-full flex flex-col ">
                  <span className="absolute bg-secondary text-center w-full border-b border-black py-4 font-bold text-[25px]">
                    Molaya Çıkma Sebebi
                  </span>
                  <div className="w-full h-full flex flex-col overflow-x-scroll mt-16">
                    {molaReason &&
                      molaReason.map((item) => (
                        <span
                          key={item.break_reason_id}
                          className={`py-[15px] text-[20px] cursor-pointer hover:text-white hover:bg-gray-600  text-center border-b border-black 
                           ${
                             araSebebi === item.break_reason_id
                               ? "bg-green-600 text-white"
                               : ""
                           }`}
                          onClick={() => setAraSebebi(item.break_reason_id)}
                        >
                          {item.break_reason}
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
                          <th>{araSebebi}</th>
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

export default MolaPopup;
