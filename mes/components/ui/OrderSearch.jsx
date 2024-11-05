import React, { useState } from "react";
import Input from "./Input";
import {
  setReadOrder,
  setSelectedMachine,
  setSelectedProcess,
} from "@/redux/orderSlice";
import { useDispatch } from "react-redux";
import axios from "axios";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { usePathname } from "next/navigation";
import { getWorkList } from "@/api/client/cOrderOperations";

function OrderSearch() {
  const dispatch = useDispatch();
  const [orderList, setOrderList] = useState([]);
  const [order_id, setOrderId] = useState("");
  const { selectedProcess, selectedHammerSectionField } = useSelector(
    (state) => state.order
  );
  const { isCurrentBreak } = useSelector((state) => state.break);
  const pathName = usePathname();
  const areaName = pathName.split("/")[3];
  const sectionName = pathName.split("/")[2];
  const { userInfo } = useSelector((state) => state.user);

  const handleChangeOrder = (e) => {
    setOrderId(e.target.value);
  };

  //! Gırılen sıparıs no ıcın detayları getırecek servise isteği atacak ve yeni işi olusturacak metot. metot...
  const handleGetOrder = async () => {
    if (!order_id) {
      toast.error("Sipariş no giriniz...");
      return;
    }

    try {
      // Sipariş bilgilerini getirmek için istek at
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/getOrder`,
        { params: { id: order_id } }
      );

      if (response.status === 200) {
        console.log(response.data);
        dispatch(setReadOrder(response.data));
        setOrderId("");

        const work_info = {
          user_id_dec: userInfo.id_dec,
          op_username: userInfo.op_username,
          order_id: response.data.ORDER_ID,
          section: sectionName,
          area_name: areaName,
          work_status: "1", // 1 ise iş aktif
          process_id: selectedProcess?.process_id,
          process_name: selectedProcess?.process_name,
          production_amount: response.data.PRODUCTION_AMOUNT,
        };

        // `process_id` kontrolü
        if (!selectedProcess?.process_id) {
          toast.error("Sipariş başlatmadan önce process ve makine seçiniz.");
          return;
        }

        // İş başlatma isteği
        try {
          const workLogResponse = await axios.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/createWorkLog`,
            { work_info }
          );

          if (workLogResponse.status === 200) {
            toast.success("İş başarıyla başlatıldı.");
            getWorkList({ areaName, userId: userInfo.id_dec, dispatch });
            dispatch(setSelectedProcess(""));
          }
        } catch (err) {
          console.error("İş başlatma sırasında hata:", err);
          toast.error("İş başlatma sırasında bir hata oluştu.");
        }
      }
    } catch (err) {
      console.error("Siparişi çekerken hata:", err);
      toast.error("Siparişi çekerken bir hata oluştu.");
    }
  };

  //! Çekilen siparişleri bir dizide topluyoruz gruplama olan ekranlarda kullanmak ıcın... aşağıda ekrana göre arama şartı kostuk...
  const handleAddOrderToList = async () => {
    if (order_id) {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/getOrder`,
          { params: { id: order_id } }
        );
        console.log(response.data);

        if (response.status === 200) {
          setOrderList([...orderList, response.data]);
          setOrderId("");
          toast.success("Sipariş listeye eklendi.");
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

  //! Cekic ekranı ıcın setuplu ekran iş okutulacak fonksıyon...
  const handleCreateOrderCekic = async () => {
    if (!order_id) {
      toast.error("Sipariş no giriniz...");
      return;
    }

    if (!selectedHammerSectionField) {
      toast.error("Sipariş okutmadan önce alan seçimi yapınız.");
      return;
    }

    try {
      // Sipariş bilgilerini getir
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/getOrder`,
        { params: { id: order_id } }
      );

      if (response.status === 200) {
        dispatch(setReadOrder(response.data));
        setOrderId("");
        // Makine seçimi yapılmışsa
        if (selectedHammerSectionField === "makine") {
          toast.success(
            "Sipariş başarıyla okutuldu. Proses ve makine seçip setup başlatabilirsiniz."
          );
          return;
        }

        const work_info = {
          user_id_dec: userInfo.id_dec,
          op_username: userInfo.op_username,
          order_id: response.data.ORDER_ID, // response'dan gelen sipariş bilgileri kullanılıyor
          section: sectionName,
          area_name: areaName,
          work_status: "1",
          process_id: selectedProcess?.process_id,
          process_name: selectedProcess?.process_name,
          production_amount: response.data.PRODUCTION_AMOUNT,
        };

        // İş başlatma isteği gönder
        const workLogResponse = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/createWorkLog`,
          { work_info, field: selectedHammerSectionField }
        );

        if (workLogResponse.status === 200) {
          toast.success("İş başarıyla başlatıldı.");
          getWorkList({ areaName, userId: userInfo.id_dec, dispatch });
          dispatch(setSelectedProcess(""));
          dispatch(setSelectedMachine(""));
        }
      }
    } catch (err) {
      console.error("İş başlatma sırasında hata:", err);
      toast.error("İş başlatma sırasında bir hata oluştu.");
    }
  };

  // const handleStartBatchOrders = async () => {
  //   if (orderList.length === 0) {
  //     toast.error("Toplu işleme başlatmak için sipariş ekleyiniz.");
  //     return;
  //   }

  //   const work_info_list = orderList.map(order => ({
  //     user_id_dec: userInfo.id_dec,
  //     op_username: userInfo.op_username,
  //     order_id: order.ORDER_ID,
  //     section: sectionName,
  //     area_name: areaName,
  //     work_status: "1",
  //     process_id: selectedProcess?.process_id,
  //     process_name: selectedProcess?.process_name,
  //     production_amount: order.PRODUCTION_AMOUNT,
  //   }));

  //   try {
  //     const response = await axios.post(
  //       `${process.env.NEXT_PUBLIC_API_BASE_URL}/createBatchWorkLogs`,
  //       { work_info_list }
  //     );

  //     if (response.status === 200) {
  //       toast.success("Toplu iş başarıyla başlatıldı.");
  //       getWorkList({ areaName, userId: userInfo.id_dec, dispatch });
  //       setOrderList([]);
  //     }
  //   } catch (err) {
  //     console.error("Toplu iş başlatma sırasında hata:", err);
  //     toast.error("Toplu iş başlatma sırasında bir hata oluştu.");
  //   }
  // };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (areaName === "kalite") {
        handleGetOrder();
      } else if (areaName === "buzlama") {
        handleAddOrderToList();
      } else if (areaName === "cekic") {
        handleCreateOrderCekic();
      }
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
