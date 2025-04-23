import React, { useEffect, useState } from "react";
import Input from "./Input";
import {
  getJoinTheField,
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
import {
  setUser,
  setUserIdPopup,
  setSelectedPartners,
} from "@/redux/userSlice";

function OrderSearch() {
  const dispatch = useDispatch();
  const [orderList, setOrderList] = useState([]);
  const [order_id, setOrderId] = useState("");
  const { selectedProcess, selectedHammerSectionField, selectedMachine } =
    useSelector((state) => state.order);
  const { isCurrentBreak } = useSelector((state) => state.break);
  const { isRequiredUserId } = useSelector((state) => state.global);
  const pathName = usePathname();
  const areaName = pathName.split("/")[3];
  const sectionName = pathName.split("/")[2];
  const { userInfo, user, userIdPopup, selectedPartners } = useSelector(
    (state) => state.user
  );
  const [retryAction, setRetryAction] = useState(null); // İşlem türü/ismi tutulacak
  const [lastMachineId, setLastMachineId] = useState(null);

  const userTimeoutEnabledScreens = ["buzlama"];

  //? Timeout start
  // //! Seçilen makine değiştikçe user state ini sıfırlayacak...
  // useEffect(() => {
  //   const currentMachineId = selectedMachine?.machine_id;
  //   const isEnabled = userTimeoutEnabledScreens.includes(areaName);

  //   if (
  //     isEnabled &&
  //     currentMachineId &&
  //     currentMachineId !== lastMachineId &&
  //     user?.id_dec
  //   ) {
  //     dispatch(setUser(null));
  //     dispatch(setSelectedPartners([]));
  //     setLastMachineId(currentMachineId);
  //   }
  // }, [selectedMachine]);

  // //!  kullanıcı bir kere ID girince 20 saniye boyunca başka sipariş okutmasına izin verir. 60 saniye geçince tekrar ID istenir.
  // useEffect(() => {
  //   if (!userTimeoutEnabledScreens.includes(areaName)) return;

  //   if (user?.id_dec) {
  //     const timer = setTimeout(() => {
  //       dispatch(setUser(null));
  //       dispatch(setSelectedPartners([]));
  //     }, 20000);

  //     return () => clearTimeout(timer); // cleanup
  //   }
  // }, [user, areaName]);

  //? Timeout end

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

  // Proses Order ve Makine kontrolü
  const isValidProcessAndMachine = (process, machine) => {
    const isMachineEmpty = Object.keys(machine).length === 0;
    const isHammerSectionField =
      areaName === "cekic" && selectedHammerSectionField === "makine";
    const screens = ["telcekme", "buzlama", "kurutiras"];
    const isScreen = screens.includes(areaName);

    if (!order_id) {
      toast.error("Sipariş no giriniz...");
      return;
    }

    // 1. Eğer "telcekme", "buzlama", "kurutiras" veya "çekiş-makine" ise, proses ve makine seçilmeli
    if (isScreen || isHammerSectionField) {
      if (!process || isMachineEmpty) {
        toast.error("Siparişi başlatmak için makine ve proses seçiniz.");
        dispatch(setSelectedPartners([]));
        dispatch(setUser(null));
        return false;
      }
    }

    // 2. Eğer "kalite" ekranıysa, proses seçilmeli
    if ((areaName === "kalite" || areaName === "cila") && !process) {
      toast.error("Siparişi başlatmak için proses seçiniz.");
      dispatch(setUser(null));
      return false;
    }

    // 3. Eğer "çekiş" ekranıysa, bir alan seçilmeli
    if (areaName === "cekic" && !selectedHammerSectionField) {
      toast.error("Sipariş okutmadan önce alan seçimi yapınız.");
      return false;
    }

    return true;
  };

  //! Gırılen sıparıs no ıcın detayları getırecek servise isteği atacak ve yeni işi olusturacak metot. metot...
  const handleGetOrder = async () => {
    if (!isValidProcessAndMachine(selectedProcess, selectedMachine)) {
      return; // Eğer fonksiyon false döndürdüyse sipariş başlatma işlemi burada duracak.
    }

    if (isRequiredUserId && (!user || !user.id_dec)) {
      setRetryAction("createOrder"); // İşlem kaydediliyor
      dispatch(
        setUserIdPopup({
          visible: true,
          showOrderDetails: areaName === "telcekme", // Sadece telçekme için ekstra alan göster
        })
      );
      return; // Kullanıcı giriş yapana kadar devam etme
    }

    try {
      // Sipariş bilgilerini getirmek için istek at
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/getOrder`,
        { params: { id: order_id } }
      );

      if (response.status === 200) {
        dispatch(setReadOrder(response.data));
        setOrderId("");

        const work_info = {
          user_id_dec: userInfo.id_dec,
          op_username: userInfo.op_username,
          order_id: response.data.ORDER_ID,
          old_code: response.data.OLD_CODE,
          section: sectionName,
          area_name: areaName,
          work_status: "1", // 1: İş aktif
          process_id: selectedProcess?.process_id,
          process_name: selectedProcess?.process_name,
          production_amount: response.data.PRODUCTION_AMOUNT,
          machine_name: selectedMachine?.machine_name,
        };

        if (
          areaName === "buzlama" ||
          areaName === "telcekme" ||
          areaName === "kurutiras"
        ) {
          work_info.user_id_dec = user.id_dec;
          work_info.op_username = user.op_username;
        } else if (
          areaName === "cekic" &&
          selectedHammerSectionField !== "makine"
        ) {
          work_info.user_id_dec = user.id_dec;
          work_info.op_username = user.op_username;
          work_info.work_status = "1";
          work_info.field = selectedHammerSectionField;
        } else if (
          areaName === "cekic" &&
          selectedHammerSectionField === "makine"
        ) {
          work_info.user_id_dec = user.id_dec;
          work_info.op_username = user.op_username;
          work_info.work_status = "0";
          work_info.field = selectedHammerSectionField;
        }

        // İş başlatma isteği
        try {
          let controlPartipation;
          if (areaName === "telcekme") {
            controlPartipation = await axios.post(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/check-participation`,
              { user_id: user.id_dec, areaName }
            );

            if (controlPartipation.data.joined) {
              toast.error(controlPartipation.data.message);
              dispatch(setUser(null));
              return;
            }
          }

          const workLogResponse = await axios.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/createWorkLog`,
            { work_info }
          );

          if (workLogResponse.status === 200) {
            toast.success("İş başarıyla başlatıldı.");
            const newUniqId = workLogResponse.data.result.uniq_id; // API'den dönen uniq_id

            //! İş telçekmede başlatıldıysa bölüme katılımı yap
            if (areaName === "telcekme") {
              const selectedPartner = selectedPartners.map(
                (partner) => partner.id_dec
              );
              const allUsersIds = [user.id_dec, ...selectedPartner];
              try {
                const joinSectionResponse = await axios.post(
                  `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/join-section`,
                  {
                    section: sectionName,
                    areaName,
                    user_id: allUsersIds,
                    machine_name: selectedMachine?.machine_name,
                    workIds: [response.data.ORDER_ID], // Tek sipariş ID’si
                    uniqIds: [newUniqId], // Tüm kullanıcılar için tek uniq_id
                    field: selectedHammerSectionField,
                  }
                );

                if (joinSectionResponse.status === 200) {
                  toast.success("Bölüme katılım başarılı.");
                  dispatch(getJoinTheField({ areaName }));
                } else {
                  toast.error("Bölüme katılım sırasında bir hata oluştu.");
                  dispatch(setUser(null));
                  return;
                }
              } catch (error) {
                console.error("Bölüme katılım sırasında hata:", error);
                toast.error(
                  error.response?.data?.message ||
                    "Bölüme katılım işlemi başarısız oldu."
                );
                dispatch(setUser(null));
                return;
              }
            }

            // Job table yenile ekranın türüne göre...
            if (isRequiredUserId) {
              dispatch(getWorksWithoutId({ areaName }));
              if (!userTimeoutEnabledScreens.includes(areaName)) {
                dispatch(setUser(null));
                dispatch(setSelectedPartners([]));
              }
            } else {
              getWorkList({ areaName, userId: userInfo.id_dec, dispatch });
              dispatch(setSelectedProcess(""));
              dispatch(setSelectedPartners([]));
            }
          }
        } catch (err) {
          console.error("İş başlatma sırasında hata:", err);
          toast.error(
            err.response?.data?.message || "Siparişi çekerken bir hata oluştu."
          );
          dispatch(setUser(null));
          dispatch(setSelectedPartners([]));
        }
      }
    } catch (err) {
      console.error("Siparişi çekerken hata:", err);
      toast.error(
        err.response?.data?.message || "Siparişi çekerken bir hata oluştu."
      );
      dispatch(setUser(null));
    }
  };

  //! Çekilen siparişleri bir dizide topluyoruz gruplama olan ekranlarda kullanmak ıcın... aşağıda ekrana göre arama şartı kostuk...
  const handleAddOrderToList = async () => {
    if (order_id) {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/getOrder`,
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

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (
        areaName === "kalite" ||
        areaName === "buzlama" ||
        areaName === "cekic" ||
        areaName === "kurutiras" ||
        areaName === "telcekme" ||
        areaName === "cila"
      ) {
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
        disabled={false}
      />
      {/* <Button children="Numune Yap" /> */}
    </div>
  );
}

export default OrderSearch;
