import React, {useState } from "react";
import Input from "./Input";
import { setReadOrder, setSelectedProcess } from "@/redux/orderSlice";
import { useDispatch } from "react-redux";
import axios from "axios";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { usePathname } from "next/navigation";
import { getWorkList } from "@/api/client/cOrderOperations";

function OrderSearch() {
  const dispatch = useDispatch();
  const [order_id, setOrderId] = useState("");
  const { selectedProcess } = useSelector((state) => state.order);
  const { isCurrentBreak } = useSelector((state) => state.break)
  const pathName = usePathname();
  const areaName = pathName.split("/")[3];
  const sectionName = pathName.split("/")[2];
  const { userInfo } = useSelector((state) => state.user);

  const handleChangeOrder = (e) => {
    setOrderId(e.target.value);
  };

  //! Gırılen sıparıs no ıcın detayları getırecek servise isteği atacak ve yeni işi olusturacak metot. metot...
  const handleGetOrder = async () => {
    if (order_id) {
      try {
        // Okutulan sipairş bilgilerini al...
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/getOrder`,
          { params: { id: order_id } }
        );
        console.log(response.data);

        if (response.status === 200) {
          dispatch(setReadOrder(response.data));
          setOrderId("");
          const work_info = {
            user_id_dec: userInfo.id_dec,
            op_username:userInfo.op_username,
            order_id: response.data.ORDER_ID,
            section: sectionName,
            area_name: areaName,
            work_status: "1", // 1 ise iş aktif
            process_id: selectedProcess?.process_id,
            process_name: selectedProcess?.process_name,
            production_amount: response.data.PRODUCTION_AMOUNT,
          };

          if (selectedProcess?.process_id) {
            try {
              const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/createWorkLog`,
                { work_info }
              );
              
              if (response.status === 200) {
                toast.success("İş başarıyla başlatıldı.");
                getWorkList({ areaName, userId: userInfo.id_dec, dispatch });
                dispatch(setSelectedProcess(""));
              }
            } catch (err) {
              console.error("İş başlatma sırasında hata:", err);
              toast.error("İş başlatma sırasında bir hata oluştu.");
            }
          } else {
            toast.error("Sipariş baslatmadan önce process ve makine seçiniz.");
          }
        }
      } catch (err) {
        console.error("Siparişi çekerken hata:", err);
        toast.error("Siparişi çekerken bir hata oluştu.");
      }
    } else if (order_id === "") {
      toast.error("Sipariş no giriniz...");
    } else {
      toast.error("Girdiğiniz sipariş numarası hatalı...");
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
        addProps={`text-center text-black h-14`}
        placeholder="Sipariş No"
        onChange={(e) => handleChangeOrder(e)}
        onKeyDown={handleKeyDown}
        value={order_id}
        disabled={isCurrentBreak}
      />
      {/* <Button children="Numune Yap" /> */}
    </div>
  );
}

export default OrderSearch;
