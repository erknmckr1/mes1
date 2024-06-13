import React from "react";
import Input from "./Input";
import Button from "./Button";
import { useState } from "react";
import { setReadOrder } from "@/redux/orderSlice";
import { useDispatch } from "react-redux";
import axios from "axios";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { usePathname } from "next/navigation";
import { getWorkList } from "@/api/client/cOrderOperations";

function OrderSearch() {
  const dispatch = useDispatch();
  const [order_id, setOrderId] = useState("");
  const {read_order,selectedProcess} = useSelector((state)=>state.order)
  const pathName = usePathname();
  const areaName = pathName.split("/")[2] 
  const sectionName = pathName.split("/")[1]
  const {userInfo} = useSelector(state=>state.user)

  const handleChangeOrder = (e) => {
    setOrderId(e.target.value);
  };

  //! Gırılen sıparıs no ıcın detayları getırecek servise isteği atacak ve yeni işi olusturacak metot. metot...
  const handleGetOrder = async () => {
    if (order_id) {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/getOrder`,
          { params: { id: order_id } }
        );
  
        if (response.status === 200) {
          dispatch(setReadOrder(response.data));

          const work_info = {
            user_id_dec: userInfo.id_dec,
            order_id: response.data.ORDER_ID,
            section: sectionName,
            area_name: areaName,
            work_status: "1", // 1 ise iş aktif
            process_id: selectedProcess?.process_id,
            // produced_amount: "100",
          };

          if (areaName === "kalite") {
            try {
              const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/createWorkLog`,
                { work_info }
              );
  
              if (response.status === 200) {
                toast.success("İş başarıyla başlatıldı.");
                getWorkList(areaName,dispatch);
              } else {
                toast.error("İş başlatma sırasında bir hata oluştu.");
              }
            } catch (err) {
              console.error("İş başlatma sırasında hata:", err);
              toast.error("İş başlatma sırasında bir hata oluştu.");
            }
          }
        } else if (response.status === 404) {
          toast.error("Girilen sipariş no'ya dair veri bulunamadı.");
        }
      } catch (err) {
        console.error("Siparişi çekerken hata:", err);
        toast.error("Siparişi çekerken bir hata oluştu.");
      }
    } else {
      toast.error("Sipariş no giriniz...");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleGetOrder();
    }
  };

  return (
    <div className="flex flex-col gap-y-2">
      <Input
        addProps="text-center text-black"
        placeholder="Sipariş No"
        onChange={(e) => handleChangeOrder(e)}
        onKeyDown={handleKeyDown}
      />
      <Button children="Numune Yap" />
    </div>
  );
}

export default OrderSearch;
