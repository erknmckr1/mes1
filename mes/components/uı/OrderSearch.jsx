import React from "react";
import Input from "./Input";
import Button from "./Button";
import { useState } from "react";
import { setReadOrder } from "@/redux/orderSlice";
import { useDispatch } from "react-redux";
import axios from "axios";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
function OrderSearch() {
  const dispatch = useDispatch();
  const [order_id, setOrderId] = useState("");
  const {read_order} = useSelector((state)=>state.order)
  const handleChangeOrder = (e) => {
    setOrderId(e.target.value);
  };

  //! Gırılen sıparıs no ıcın detayları getırecek servise isteği atacak metot...
  const handleGetOrder = async () => {
    if (order_id) {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/getOrder`,
          { params: { id: order_id } }
        );

        if (response.status === 200) {
          dispatch(setReadOrder(response.data));
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
