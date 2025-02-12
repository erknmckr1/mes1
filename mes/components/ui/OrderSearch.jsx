import React, { useEffect, useState } from "react";
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
import { getWorksWithoutId } from "@/redux/orderSlice";
import { setUser, setUserIdPopup } from "@/redux/userSlice";

function OrderSearch() {
  const dispatch = useDispatch();
  const [orderList, setOrderList] = useState([]);
  const [order_id, setOrderId] = useState("");
  const { selectedProcess, selectedHammerSectionField, selectedMachine } =
    useSelector((state) => state.order);
  const { isCurrentBreak } = useSelector((state) => state.break);
  const pathName = usePathname();
  const areaName = pathName.split("/")[3];
  const sectionName = pathName.split("/")[2];
  const { userInfo, user } = useSelector((state) => state.user);
  const [retryAction, setRetryAction] = useState(null); // İşlem türü/ismi tutulacak
  const handleChangeOrder = (e) => {
    setOrderId(e.target.value);
  };

  useEffect(() => {
    if (retryAction && user && user.id_dec) {
      switch (retryAction) {
        case "createOrder":
          handleGetOrder();
          break;
      }
      setRetryAction(null); // İşlem tamamlandıktan sonra sıfırla
    }
  }, [retryAction, user]);

  //! Gırılen sıparıs no ıcın detayları getırecek servise isteği atacak ve yeni işi olusturacak metot. metot...
  const handleGetOrder = async () => {
    if (!order_id) {
      toast.error("Sipariş no giriniz...");
      return;
    }

    // Eğer "buzlama" ekranındaysak ve kullanıcı ID eksikse, popup aç
    if (areaName === "buzlama" && (!user || !user.id_dec)) {
      setRetryAction("createOrder"); // İşlem kaydediliyor
      dispatch(setUserIdPopup(true));
      return; // Kullanıcı giriş yapana kadar devam etme
    }

    try {
      // Sipariş bilgilerini getirmek için istek at
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/getOrder`,
        { params: { id: order_id } }
      );

      if (response.status === 200) {
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
          machine_name: selectedMachine?.machine_name,
        };

        if (areaName === "buzlama") {
          if (!selectedProcess || !selectedMachine) {
            toast.error("Sipariş başlatmadan önce proses ve makine seçin.");
            dispatch(setUser(null));
            return;
          }
        }

        // `process_id` kontrolü
        if (!selectedProcess?.process_id) {
          toast.error("Sipariş başlatmadan önce process seçiniz.");
          return;
        }

        if (areaName === "buzlama") {
          work_info.user_id_dec = user.id_dec;
          work_info.op_username = user.op_username;
        }

        // İş başlatma isteği
        try {
          const workLogResponse = await axios.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/createWorkLog`,
            { work_info }
          );

          if (workLogResponse.status === 200) {
            toast.success("İş başarıyla başlatıldı.");
            if (areaName === "buzlama") {
              dispatch(getWorksWithoutId({ areaName }));
              dispatch(setUser(null));
            } else {
              getWorkList({ areaName, userId: userInfo.id_dec, dispatch });
            }
            dispatch(setSelectedProcess(""));
          }
        } catch (err) {
          console.error("İş başlatma sırasında hata:", err);
          toast.error(err.response.data || "Siparişi çekerken bir hata oluştu.");
        }
      }
    } catch (err) {
      console.error("Siparişi çekerken hata:", err);
      toast.error(err?.response.data || "Siparişi çekerken bir hata oluştu.");
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
      if (areaName === "kalite" || areaName === "buzlama") {
        handleGetOrder();
      } else if (areaName === "") {
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
