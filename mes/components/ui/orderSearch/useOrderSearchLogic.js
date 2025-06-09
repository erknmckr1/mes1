import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { usePathname } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
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
      if (retryAction === "createOrder") handleGetOrder();
      setRetryAction(null);
    }
  }, [retryAction, user]);

  // Sipariş baslatırken id gerekli mi kontrolü yapacak ve kullanıcı ID'si girilmemişse popup açacak...
  const checkUserIdRequirement = async () => {
    if (isRequiredUserId && (!user || !user.id_dec)) {
      setRetryAction("createOrder");
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
  const fetchOrderAndSetStates = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/getOrder`,
        { params: { id: orderId } }
      );
      if (response.status === 200) {
        dispatch(setReadOrder(response.data));
        setOrderId("");
        await fetchAndSetWorkHistory(orderId);
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

  // Telçekme alanına katılmak için gerekli işlemleri yapacak metot...
  const checkTelcekmeParticipation = async () => {
    if (areaName !== "telcekme") return false;
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/check-participation`,
        { user_id: user.id_dec, areaName }
      );
      if (res.data.joined) {
        toast.error(res.data.message);
        dispatch(setUser(null));
        return true;
      }
    } catch (err) {
      console.log("Katılım hatası:", err);
    }
    return false;
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

  // Telçekme alanına katılma işlemi
  const joinTelcekmeSection = async (orderId, uniqId) => {
    try {
      const partnerIds = selectedPartners.map((p) => p.id_dec);
      const userIds = [user.id_dec, ...partnerIds];
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/join-section`,
        {
          section: sectionName,
          areaName,
          user_id: userIds,
          machine_name: selectedMachine?.machine_name,
          workIds: [orderId],
          uniqIds: [uniqId],
          field: selectedHammerSectionField,
        }
      );
      if (res.status === 200) {
        toast.success("Bölüme katılım başarılı.");
        dispatch(getJoinTheField({ areaName }));
        return true;
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Katılım işlemi başarısız oldu."
      );
      dispatch(setUser(null));
    }
    return false;
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
        setSelectedPartners
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
    if (await checkTelcekmeParticipation()) return;
    const uniqId = await createWorkLogAndReturnUniqId(workInfo);
    if (!uniqId) return;
    if (areaName === "telcekme") {
      const joined = await joinTelcekmeSection(orderData.ORDER_ID, uniqId);
      if (!joined) return;
    }
    updateWorkTables();
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
  };
}

export default useOrderSearchLogic;
