import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { usePathname } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import {
  checkTelcekmeParticipation,
  joinTelcekmeSection,
} from "./joinSectionService/telcekmeService";
import {
  isValidProcessAndMachine,
  checkCilaDuplicateOrder,
} from "@/utils/validations/orderSearchValidationRules";
import {
  setReadOrder,
  setSelectedProcess,
  getJoinTheField,
  getWorksWithoutId,
  setWorkHistoryData,
  clearScannedOrders
} from "@/redux/orderSlice";
import {
  setUser,
  setUserIdPopup,
  setSelectedPartners,
} from "@/redux/userSlice";
import { getWorkList } from "@/api/client/cOrderOperations";
import { orderSearchBuildWorkInfo } from "@/utils/validations/requestBuilders";
function useOrderSearchLogic() {
  const dispatch = useDispatch();
  const pathName = usePathname();
  const areaName = pathName.split("/")[3];
  const sectionName = pathName.split("/")[2];
  const [orderId, setOrderId] = useState("");
  const [retryAction, setRetryAction] = useState(null);
  const {scannedOrders} = useSelector((state) => state.order);
  const {
    selectedProcess,
    selectedMachine,
    selectedHammerSectionField,
    workList,
  } = useSelector((state) => state.order);
  const { isRequiredUserId } = useSelector((state) => state.global);
  const { userInfo, user, selectedPartners } = useSelector(
    (state) => state.user
  );
  const userTimeoutEnabledScreens = ["buzlama"];

  useEffect(() => {
    if (retryAction && user && user.id_dec) {
      if (retryAction === "createOrder") {
        handleGetOrder();
      } else if (retryAction === "bulkCreateOrder") {
        if (scannedOrders.length > 0) {
          handleCreateOrderBulk(scannedOrders);
        } else {
          toast.warn("Başlatılacak sipariş bulunamadı.");
        }
      }
      setRetryAction(null);
    }
  }, [retryAction, user, scannedOrders]);

  // Sipariş baslatırken id gerekli mi kontrolü yapacak ve kullanıcı ID'si girilmemişse popup açacak...
  const checkUserIdRequirement = async (retryType = "createOrder") => {
    if (isRequiredUserId && (!user || !user.id_dec)) {
      setRetryAction(retryType);
      dispatch(
        setUserIdPopup({
          visible: true,
          showOrderDetails: areaName === "telcekme",
        })
      );
      return true;
    }
    return false;
  };

  // sipariş bilgilerini çekecek ve state'leri ayarlayacak metot...
  const fetchOrderAndSetStates = async (customOrderId) => {
    try {
      const currentOrderId = customOrderId || orderId; // Öncelik parametrede, yoksa state'ten al
      if (!currentOrderId) return null;

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/getOrder`,
        { params: { id: currentOrderId } }
      );
      if (response.status === 200) {
        dispatch(setReadOrder(response.data));
        setOrderId("");
        await fetchAndSetWorkHistory(currentOrderId);
        return response.data;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Sipariş bilgisi çekilemedi.");
      dispatch(setUser(null));
    }
    return null;
  };

  // Geçmiş iş verilerini çekecek ve state'e set edecek metot...
  const fetchAndSetWorkHistory = async (orderId) => {
    if (areaName !== "cila") return false; // şimdilik sadece cila ekranında çalışsın..
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/getWorkHistory`,
        { params: { id: orderId } }
      );
      dispatch(setWorkHistoryData(res.data?.data || []));
    } catch (error) {
      dispatch(setWorkHistoryData([]));
    }
  };

  // İş oluştur ve uniq ID döndür
  const createWorkLogAndReturnUniqId = async (work_info) => {
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/createWorkLog`,
        { work_info }
      );
      if (res.status === 200) {
        toast.success("İş başarıyla başlatıldı.");
        return res.data.result.uniq_id;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "İş başlatılamadı.");
      dispatch(setUser(null));
      dispatch(setSelectedPartners([]));
    }
    return null;
  };

  // İş tablosunu güncelleyecek metot...
  const updateWorkTables = () => {
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
  };

  //! Gırılen sıparıs no ıcın detayları getırecek servise isteği atacak ve yeni işi olusturacak metot. metot...
  //! Tekli sipariş okutmalarda çalışacak fonksiyon...
  const handleGetOrder = async () => {
    if (
      !isValidProcessAndMachine({
        selectedMachine,
        selectedHammerSectionField,
        areaName,
        selectedProcess,
        orderId,
        dispatch,
        setUser,
        setSelectedPartners,
      })
    )
      return;
    if (await checkUserIdRequirement()) return;
    if (checkCilaDuplicateOrder({ areaName, workList, selectedProcess }))
      return;
    const orderData = await fetchOrderAndSetStates();
    if (!orderData) return;
    const workInfo = orderSearchBuildWorkInfo({
      orderData,
      user,
      userInfo,
      areaName,
      sectionName,
      selectedProcess,
      selectedMachine,
      selectedHammerSectionField,
    });
    if (!workInfo) return;
    if (await checkTelcekmeParticipation(areaName, user)) return;
    const uniqId = await createWorkLogAndReturnUniqId(workInfo);
    if (!uniqId) return;
    if (areaName === "telcekme") {
      const joined = await joinTelcekmeSection({
        orderId: orderData.ORDER_ID,
        uniqId,
        dispatch,
        setUser,
        toast,
        selectedPartners,
        user,
        sectionName,
        areaName,
        selectedMachine,
        selectedHammerSectionField,
        getJoinTheField,
      });
      if (!joined) return;
    }
    updateWorkTables();
  };

  //! Çoklu sipariş okutmalarda çalışacak fonksiyon...
  const handleCreateOrderBulk = async (orderIds) => {
    const groupId = `GRP-${Date.now()}`; // örnek: GRP-1720368500000
    if (await checkUserIdRequirement("bulkCreateOrder")) return;

    for (const currentOrderId of orderIds) {
      if (
        !isValidProcessAndMachine({
          selectedMachine,
          selectedHammerSectionField,
          areaName,
          selectedProcess,
          orderId: currentOrderId,
          dispatch,
          setUser,
          setSelectedPartners,
        })
      )
        return;
      const orderData = await fetchOrderAndSetStates(currentOrderId); // parametre almalı
      if (!orderData) continue;

      const workInfo = orderSearchBuildWorkInfo({
        orderData,
        user,
        userInfo,
        areaName,
        sectionName,
        selectedProcess,
        selectedMachine,
        selectedHammerSectionField,
        groupId
      });
      if (!workInfo) continue;

      if (await checkTelcekmeParticipation(areaName, user)) continue;

      const uniqId = await createWorkLogAndReturnUniqId(workInfo);
      if (!uniqId) continue;

      if (areaName === "telcekme") {
        const joined = await joinTelcekmeSection({
          orderId: orderData.ORDER_ID,
          uniqId,
          dispatch,
          setUser,
          toast,
          selectedPartners,
          user,
          sectionName,
          areaName,
          selectedMachine,
          selectedHammerSectionField,
          getJoinTheField,
        });
        if (!joined) continue;
      }

      updateWorkTables(); // HER sipariş sonunda çağrılmalı
      dispatch(clearScannedOrders());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (
        [
          "kalite",
          "buzlama",
          "cekic",
          "kurutiras",
          "telcekme",
          "cila",
        ].includes(areaName)
      ) {
        handleGetOrder();
      }
    }
  };

  const handleChangeOrder = (e) => setOrderId(e.target.value);

  return {
    orderId,
    setOrderId,
    handleKeyDown,
    handleChangeOrder,
    handleCreateOrderBulk,
  };
}

export default useOrderSearchLogic;
