import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setFinishedWorkPopup, setSelectedOrder } from "@/redux/orderSlice";
import { useState, useEffect } from "react";
import Button from "../../uı/Button";
import Input from "../../uı/Input";
import axios from "axios";
import { toast } from "react-toastify";
import { getWorkList } from "@/api/client/cOrderOperations";
import { usePathname } from "next/navigation";

function FinishedWorkPopup() {
  // veriler Bu verilere globalde ıhtıyac duyulursa redux a tası...

  const [finishedAmount, setFinishedAmount] = useState(0);
  const [scrapAmount, setScrapAmount] = useState(0);
  const [repairAmount, setRepairAmount] = useState(0);
  const [repairReasonsList, setRepairReasonsList] = useState([]);
  const [selectedRepairReason, setSelectedRepairReason] = useState("");
  const [selectedScrapReason, setSelectedScrapReason] = useState("");
  const [repairReasonOne, setRepairReasonOne] = useState("");
  const [repairReasonTwo, setRepairReasonTwo] = useState("");
  const [repairReasonThree, setRepairReasonThree] = useState("");
  const [repairReasonFour, setRepairReasonFour] = useState("");

  // veriler
  const dispatch = useDispatch();
  const { selectedOrder } = useSelector((state) => state.order);
  const { userInfo } = useSelector((state) => state.user);
  const pathName = usePathname();
  const areaName = pathName.split("/")[2];

  //! Tamir nedenlerını getıren metot...
  const getRepairReason = async () => {
    try {
      const result = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/getRepairReason`,
        { params: { area_name: areaName } } // get metodu ıle parametre yolluyorsan params ı kullan.
      );
      setRepairReasonsList(result.data);
      return result.data;
    } catch (err) {
      console.error("Error fetching break reasons:", err);
    }
  };

  // // hata sebebını sececek fonksıyon
  // const handleSelectedRepairReason = (item) => {
  //   setSelectedRepairReason(item);
  // };

  // Hurda nedenını sec
  const handleSelectedScrapReason = (item) => {
    setSelectedScrapReason(item);
  };

  useEffect(() => {
    getRepairReason();
  }, []);

  useEffect(() => {
    const selectedReason = repairReasonsList.find(item => item.repair_reason_id === repairReasonOne);
    setRepairReasonOne(selectedReason ? selectedReason.repair_reason : repairReasonOne);
  }, [repairReasonOne, repairReasonsList]);

  useEffect(() => {
    const selectedReason = repairReasonsList.find(item => item.repair_reason_id === repairReasonTwo);
    setRepairReasonTwo(selectedReason ? selectedReason.repair_reason : repairReasonTwo);
  }, [repairReasonTwo, repairReasonsList]);

  useEffect(() => {
    const selectedReason = repairReasonsList.find(item => item.repair_reason_id === repairReasonThree);
    setRepairReasonThree(selectedReason ? selectedReason.repair_reason : repairReasonThree);
  }, [repairReasonThree, repairReasonsList]);

  useEffect(() => {
    const selectedReason = repairReasonsList.find(item => item.repair_reason_id === repairReasonFour);
    setRepairReasonFour(selectedReason ? selectedReason.repair_reason : repairReasonFour);
  }, [repairReasonFour, repairReasonsList]);

  console.log(selectedScrapReason)

  //! Siparişi bitirmek için tetiklenecek fonksiyon...
  const finishedWork = async () => {
   try {
      if(finishedAmount > 0) {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/finishedWork`,
          {
            uniq_id: selectedOrder.uniq_id,
            work_finished_op_dec: userInfo.id_dec,
            produced_amount: finishedAmount,
            repair_amount: repairAmount,
            scrap_amount: scrapAmount,
            repair_reason_1: repairReasonOne,
            repair_reason_2: repairReasonTwo,
            repair_reason_3: repairReasonThree,
            repair_reason_4: repairReasonFour,
            scrap_reason: selectedScrapReason?.repair_reason,
          }
        );
         // işlem eger basarılı ise workList i guncelle ve stateleri baslangıc durumuna getır
        if(response.status === 200){
          getWorkList(areaName, dispatch);
          toast.success("Prosesi bitirme işlemi başarılı...");
          dispatch(setFinishedWorkPopup(false));
          setRepairAmount("");
          dispatch(setSelectedOrder(null));
          setScrapAmount("");
          setFinishedAmount("");
          setSelectedRepairReason("");
          setSelectedScrapReason("");
        }
      }else{
        toast.error("Sağlam çikan ürün miktarini giriniz.")
      }
   } catch (err) {
    console.log(err)
    toast.error("İşlem başarısız oldu.");
   }
  };

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
      <div className="flex items-center justify-center w-full h-full">
        <div className="w-[1200px] h-[700px] bg-black border-2 border-white p-3 static z-50 rounded-md">
          <div className="w-full h-full">
            {/* title */}
            <div className="h-[100px] text-[50px] font-semibold flex justify-center items-center text-white bg-secondary">
              <span>Siparişi Bitir</span>
            </div>
            {/* parametreler... */}
            <div className="w-full h-auto flex flex-col gap-y-10 mt-4">
              {/* inputlar... */}
              <div className="w-full flex p-1 gap-x-3">
                <Input
                  addProps="h-20 text-[30px] text-center font-semibold text-black"
                  placeholder="Sağlam Çıkan Ürün (gr)"
                  value={finishedAmount}
                  onChange={(e) => setFinishedAmount(e.target.value)}
                />
                <Input
                  addProps="h-20 text-[30px] text-center font-semibold text-black"
                  placeholder="Hurda Çıkan Ürün (gr)"
                  value={scrapAmount}
                  onChange={(e) => setScrapAmount(e.target.value)}
                />
                <Input
                  addProps="h-20 text-[30px] text-center font-semibold text-black"
                  placeholder="Tamire Gidecek Ürün (gr)"
                  value={repairAmount}
                  onChange={(e) => setRepairAmount(e.target.value)}
                />
              </div>
              {/* tamir nedenleri && hurda nedenlerı */}
              <div className="h-full w-full flex gap-x-1">
                {repairAmount > 0 && (
                  <div className="w-1/2 border">
                    <div className="w-full p-2 bg-secondary font-semibold text-[25px] text-center">
                      Tamir Nedenleri
                    </div>
                    <div className="w-full h-[300px] mt-1 overflow-y-auto">
                      {/* repair reason inputları */}
                      <div className="w-full h-1/2 flex p-1 gap-x-3">
                        <Input
                          addProps="h-20 text-[30px] text-center font-semibold text-black"
                          placeholder="Tamir Sebebi 1"
                          onChange={(e) => setRepairReasonOne(e.target.value)}
                        />
                        <Input
                          addProps="h-20 text-[30px] text-center font-semibold text-black"
                          placeholder="Tamir Sebebi 2"
                          onChange={(e) => setRepairReasonTwo(e.target.value)}
                        />
                        <Input
                          addProps="h-20 text-[30px] text-center font-semibold text-black"
                          placeholder="Tamir Sebebi 3"
                          onChange={(e) => setRepairReasonThree(e.target.value)}
                        />
                        <Input
                          addProps="h-20 text-[30px] text-center font-semibold text-black"
                          placeholder="Tamir Sebebi 4"
                          onChange={(e) => setRepairReasonFour(e.target.value)}
                        />
                      </div>
                      <div className="w-full h-1/2 flex p-1 gap-x-3 ">
                        <span className="h-20 w-[135px] text-[25px] text-center font-semibold">1. {repairReasonOne}</span>
                        <span className="h-20 w-[135px] text-[25px] text-center font-semibold">2. {repairReasonTwo}</span>
                        <span className="h-20 w-[135px] text-[25px] text-center font-semibold">3. {repairReasonThree}</span>
                        <span className="h-20 w-[135px] text-[25px] text-center font-semibold">4. {repairReasonFour}</span>
                      </div>
                    </div>
                  </div>
                )}
                {scrapAmount > 0 && (
                  <div className="w-1/2">
                    <div className="w-full p-2 bg-secondary font-semibold text-[25px] text-center">
                      Hurda Nedenleri
                    </div>
                    <div className="w-full h-[300px] mt-1 overflow-y-auto">
                      <ul className="flex flex-col gap-y-1">
                        {repairReasonsList &&
                          repairReasonsList.map((item, index) => (
                            <li
                              key={item.repair_reason_id}
                              onClick={() => handleSelectedScrapReason(item)}
                              className={`${
                                item?.repair_reason_id ===
                                selectedScrapReason?.repair_reason_id
                                  ? "bg-green-600 text-white"
                                  : "bg-[#EAEDED] hover:bg-[#F4F6F6]"
                              } p-2 text-[20px] cursor-pointer border font-semibold text-black border-white text-center transition-all`}
                            >
                              {item.repair_reason}
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* butonlar */}
            <div className="flex gap-x-10 justify-center items-center mt-3">
              {buttons.map((item, index) => (
                <Button
                  key={index}
                  className={item.className}
                  onClick={item.onClick}
                >
                  {item.children}
                </Button>
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
