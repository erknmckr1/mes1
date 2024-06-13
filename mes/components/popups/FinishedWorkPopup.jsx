import React from "react";
import { useDispatch } from "react-redux";
import { setFinishedAmount, setFinishedWorkPopup } from "@/redux/orderSlice";
import { useSelector } from "react-redux";
import { useState } from "react";
import Button from "../uı/Button";
import Input from "../uı/Input";
import axios from "axios";
import { toast } from "react-toastify";
import { getWorkList } from "@/api/client/cOrderOperations";
import { usePathname } from "next/navigation";

function FinishedWorkPopup() {
  const {finishedAmount} = useSelector((state) => state.order);
  const [finishedPiece, setFinisedPiece] = useState("");
  const dispatch = useDispatch();
  const { selectedOrder } = useSelector((state) => state.order);
  const {userInfo} = useSelector(state => state.user)
  const pathName = usePathname();
  const areaName = pathName.split("/")[2];

  const handleFinishedAmount = (e) => {
    dispatch(setFinishedAmount(e.target.value));
  };

  //! Siparişi bitirmek için tetiklenecek fonksiyon...
  const finishedWork = async () => {
    try {
      if (
        selectedOrder &&
        selectedOrder.work_status === "1" &&
        finishedAmount !== ""
      ) {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/finishedWork`,
          {
            uniq_id: selectedOrder.uniq_id,
            work_finished_op_dec: userInfo.id_dec,
            produced_amount: finishedAmount,
          }
        );

        if (response.status === 200) {
          getWorkList(areaName, dispatch);
          toast.success("Prosesi bitirme işlemi başarili...");
          dispatch(setFinishedWorkPopup(false));
        }
      } else {
        toast.error("Aktif bir proses seçin...");
      }
    } catch (err) {
      console.log(err);
      toast.error("İşlem başarısız oldu.");
    }
  };

  console.log(finishedAmount)
  const buttons = [
    {
      onClick: () => dispatch(setFinishedWorkPopup(false)),
      children: "Vazgeç",
      type: "button",
      className: "",
    },
    {
      onClick: finishedWork,
      children: "Prosesi Bitir",
      type: "button",
      className: "bg-red-600 hover:bg-red-500",
    },
  ];

  return (
    <div className="w-screen h-screen top-0 left-0 absolute">
      <div className="flex items-center justify-center w-full h-full  ">
        <div className="w-[700px] h-[500px] bg-black border-2 border-white p-3 static z-50 rounded-md ">
          <h1 className="text-[40px] bg-secondary py-3 font-semibold  text-center">
            Üretilen Miktar
          </h1>
          <div className="w-full h-auto flex flex-col gap-y-10 justify-between items-center ">
            {/* ınputs */}
            <div className=" h-auto mt-10 w-[500px]">
              <div className="flex flex-col gap-y-10">
                <Input
                  onChange={handleFinishedAmount}
                  addProps="h-20 text-[30px] text-center font-semibold text-black"
                  placeholder="Üretilen Gramaj"
                />
                <Input
                  onChange={(e) => setFinisedPiece(e.target.value)}
                  addProps="h-20 text-[30px] text-center font-semibold text-black"
                  placeholder="Üretilen Adet"
                />
              </div>
            </div>
            {/* buttons */}
            <div className=" flex gap-x-10 justify-center items-center ">
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
      <div className="w-screen h-screen absolute bg-black opacity-85 top-0 left-0"></div>
    </div>
  );
}

export default FinishedWorkPopup;
