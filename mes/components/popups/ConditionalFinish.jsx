import React from "react";
import Button from "../ui/Button";
import {
  setConditionalFinishPopup,
  setSelectedOrder,
} from "@/redux/orderSlice";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { getWorkList } from "@/api/client/cOrderOperations";
import { usePathname } from "next/navigation";
function ConditionalFinish() {
  const dispatch = useDispatch();
  const [conditionReason, setConditionReason] = useState([]);
  const [selectedConditionReason, setSelectedConditionReason] = useState([]);
  const { selectedOrder } = useSelector((state) => state.order);
  const { userInfo, user } = useSelector((state) => state.user);
  const [desc, setDesc] = useState("");
  const pathName = usePathname();
  const areaName = pathName.split("/")[3];
  const handleClosePopup = () => {
    dispatch(setConditionalFinishPopup(false));
  };

  //! Şartlı bıtırme nedenlerını cekecek fonksıyon...
  const handleGetConditionalReason = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/getConditionalReason`
      );
      if (response.status === 200) {
        setConditionReason(response.data);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    handleGetConditionalReason();
  }, []);

  const handleSelectionReason = (id) => {
    setSelectedConditionReason(id);
  };

  //! Şartlı bitirme isteği
  const handleConditionalFinish = async () => {
    const id_dec = userInfo.id_dec;
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/conditionalFinish`,
        {
          orders: selectedOrder,
          id_dec: user.id_dec,
          conditional_finish: selectedConditionReason,
          end_desc: desc,
        }
      );

      if (response.status === 200) {
        toast.success(response.data);
        getWorkList({ areaName, userId: userInfo.id_dec, dispatch });
        setSelectedConditionReason("");
        dispatch(setSelectedOrder([]));
        dispatch(setConditionalFinishPopup(false));
      } else {
        toast.error(response.data || "Şartlı bitirme işlemi başarısız oldu.");
      }
    } catch (err) {
      console.log(err);
    }
  };

  const buttons = [
    {
      children: "Kapat",
      type: "button",
      className:
        "w-[150px] h-[100px] bg-red-500 hover:bg-red-600 sm:py-2 text-md",
      onClick: handleClosePopup,
    },
    {
      children: "Şartlı Bitir",
      type: "button",
      className: "w-[150px] h-[100px] sm:py-2 text-md",
      onClick: handleConditionalFinish,
    },
  ];

  return (
    <div className="w-screen h-screen top-0 left-0 absolute text-black font-semibold">
      <div className="flex items-center justify-center w-full h-full  ">
        <div className="md:w-[1000px] w-[800px] h-[600px] bg-black border-2 border-white p-3 static z-50 rounded-md ">
          {/* Header kısmı */}
          <div className="h-[20%] w-full bg-secondary">
            <div className="w-full h-full flex items-center justify-center">
              <h1 className="text-[40px] font-semibold">Şartlı Bitir</h1>
            </div>
          </div>
          {/* section */}
          <div className="h-[60%] w-full">
            <div className="w-full h-full flex gap-x-1">
              <div className="w-1/2 bg-slate-50 text-black">
                {conditionReason?.map((item, i) => (
                  <span
                    onClick={() => handleSelectionReason(item.c_finish_id)}
                    className={`block border-b p-3 text-[25px] w-full cursor-pointer transition-all ease-in hover:bg-green-400 ${
                      selectedConditionReason === item.c_finish_id
                        ? "bg-green-600"
                        : ""
                    } `}
                    key={i}
                  >
                    {item.condition_reason}
                  </span>
                ))}
              </div>
              <div className="w-1/2 bg-slate-50 h-full">
                <div className="w-full h-full overflow-y-auto text-black">
                  <textarea
                    className="w-full p-2 h-full placeholder:text-[30px] text-[25px] font-semibold bg-[#F8F9F9]"
                    placeholder="Açıklama Giriniz"
                    onChange={(e) => {
                      setDesc(e.target.value);
                    }}
                    value={desc}
                  />
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

export default ConditionalFinish;
