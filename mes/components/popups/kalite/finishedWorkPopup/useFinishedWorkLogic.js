import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { toast } from "react-toastify";
import { isNoOrderSelected } from "@/utils/validations/operationValidationRules";
import { usePathname } from "next/navigation";
import {
  validateUserPresence,
  refreshAfterSuccessfulOperation,
} from "@/utils/handlers/orderHelpers";
import {
  setSelectedOrder,
  getJoinTheField,
  getWorksWithoutId,
  setFinishedPopupMode,
  setSelectedProcess,
  setFinishedWorkPopup,
} from "@/redux/orderSlice";
import useFinishedWorkState from "./useFinishedWorkState";
import {
  isRepairReasonValid,
  isHurdaDescriptionRequired,
} from "@/utils/validations/operationValidationRules";
export const useFinishedWorkLogic = () => {
  const {
    repairReasonsList,
    setRepairReasonsList,
    selectedScrapReason,
    setSelectedScrapReason,
    finishedAmount,
    setFinishedAmount,
    scrapAmount,
    setScrapAmount,
    productCount,
    setProductCount,
    repairAmount,
    setRepairAmount,
    desc,
    setDesc,
    repairReasons,
    setRepairReasons,
    retryAction,
    setRetryAction,
    selectedArea,
    setSelectedArea,
  } = useFinishedWorkState();
  const { user, userInfo } = useSelector((state) => state.user);
  const pathName = usePathname();
  const areaName = pathName.split("/")[3];
  const dispatch = useDispatch();

  const { selectedProcess, selectedHammerSectionField, selectedOrder } =
    useSelector((state) => state.order);
  const { isRequiredUserId } = useSelector((state) => state.global);

  // Suanlık sadece kalite ekranında kullanıyoruz daha sonra sadelesecek...
  const buildFinishedWorkPayload = () => ({
    uniq_id: selectedOrder[0].uniq_id,
    work_finished_op_dec: userInfo.id_dec,
    produced_amount: finishedAmount,
    repair_amount: repairAmount,
    scrap_amount: scrapAmount,
    repair_reason: JSON.stringify(repairReasons),
    repair_reason_1: repairReasons[0],
    repair_reason_2: repairReasons[1],
    repair_reason_3: repairReasons[2],
    repair_reason_4: repairReasons[3],
    scrap_reason: selectedScrapReason?.repair_reason,
    repair_section: selectedArea,
    end_desc: desc,
  });

  //! Tamir nedenlerını getıren metot...
  const getRepairReason = async () => {
    try {
      const result = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/getRepairReason`,
        { params: { area_name: areaName } } // get metodu ıle parametre yolluyorsan params ı kullan.
      );
      setRepairReasonsList(result.data);
      return result.data;
    } catch (err) {
      console.error("Error fetching break reasons:", err);
    }
  };

  //! Sıralı işlemlerde bitir ve sipariş başlatma işlemlerini tek butonla yapacak fonksiyon
  const nextProcess = async () => {
    if (isNoOrderSelected(selectedOrder)) {
      toast.error("Sonraki prosese geçmek için sipariş seçiniz.");
      return;
    }

    const requestData = {
      uniq_id: selectedOrder[0].uniq_id,
      process_name: selectedProcess?.process_name,
      process_id: selectedProcess?.process_id,
      product_count: productCount,
      produced_amount: finishedAmount,
    };

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/nextProcess`,
        requestData
      );

      if (response.status === 200) {
        toast.success("Sonraki prosese geçildi.");
        refreshAfterSuccessfulOperation(
          areaName,
          isRequiredUserId,
          userInfo,
          dispatch
        );
        dispatch(setFinishedWorkPopup(false));
        dispatch(setFinishedPopupMode(null));
      }
    } catch (err) {
      console.log(err);
      toast.error(err?.response?.data || "Bir hata oluştu.");
    }
  };

  // status 200 den sonra sıfırlanacak stateler finishedWork fonksıyonu için...
  const resetFinishedPopupState = () => {
    setRepairAmount("");
    dispatch(setSelectedOrder(null));
    setScrapAmount("");
    setFinishedAmount("");
    setSelectedScrapReason("");
    setRepairReasons(["", "", "", ""]);
    setDesc("");
  };
  //! Siparişi bitirmek için tetiklenecek fonksiyon...
  const finishedWork = async () => {
    if (finishedAmount <= 0) {
      toast.error("Sağlam çikan ürün miktarini giriniz.");
      return;
    }

    if (!isRepairReasonValid(repairAmount, repairReasons)) {
      toast.error("Lütfen tamir nedeni giriniz.");
      return;
    }

    const requestData = buildFinishedWorkPayload();

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/finishedWork`,
        requestData
      );

      if (response.status === 200) {
        toast.success("Prosesi bitirme işlemi başarılı...");
        refreshAfterSuccessfulOperation(
          areaName,
          isRequiredUserId,
          userInfo,
          dispatch
        );
        dispatch(setFinishedWorkPopup(false));
        resetFinishedPopupState();
      }
    } catch (err) {
      console.log(err);
      toast.error("İşlem başarısız oldu.");
    }
  };
  //! Bir ya da birden fazla sipariş iptal edecek fonksiyon, başlatılmadan önce kullanıcıdan id istiyor.
  const handleFinishWork = async () => {
    if (!finishedAmount) {
      toast.error("Sağlam cıkan urun mıktarı gırınız.");
      return;
    }

    if (isHurdaDescriptionRequired(areaName, finishedAmount, desc,scrapAmount)) {
      toast.error("Hurda açıklaması giriniz.");
      return;
    }

    if (isNoOrderSelected(selectedOrder)) {
      toast.error("Bitireceğiniz siparişleri seçin.");
      return;
    }
    // Kullanıcı ıd dogrulama
    if (
      isRequiredUserId &&
      !validateUserPresence(user, dispatch, "finishwork", setRetryAction)
    )
      return;

    const requestData = {
      uniqIds: selectedOrder.map((order) => order.uniq_id),
      areaName,
      field: selectedHammerSectionField,
      scrap_amount: scrapAmount,
      produced_amount: finishedAmount,
      repair_amount: repairAmount,
    };

    if (areaName === "cila") {
      requestData.work_finished_op_dec = userInfo.id_dec;
      requestData.product_count = productCount;
    } else {
      requestData.work_finished_op_dec = user.id_dec;
    }

    try {
      let response;
      response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/fwork`,
        requestData
      );

      if (response.status === 200) {
        if (areaName === "cila") {
          refreshAfterSuccessfulOperation(
            areaName,
            isRequiredUserId,
            userInfo,
            dispatch
          );
          toast.success(`${selectedOrder.length} iş bitirildi.`);
          dispatch(setFinishedWorkPopup(false));
        } else {
          toast.success(`${selectedOrder.length} iş bitirildi.`);
          dispatch(setFinishedWorkPopup(false));
          refreshAfterSuccessfulOperation(
            areaName,
            isRequiredUserId,
            userInfo,
            dispatch
          );
        }
      }
    } catch (err) {
      console.error("İş bitirme hatası:", err);
      toast.error(
        `${err.response.data}` || "Sipariş bitirme sırasında hata olustu."
      );
      refreshAfterSuccessfulOperation(
        areaName,
        isRequiredUserId,
        userInfo,
        dispatch
      );
      dispatch(setFinishedWorkPopup(false));
    }
  };
  return {
    getRepairReason,
    nextProcess,
    resetFinishedPopupState,
    finishedWork,
    handleFinishWork,
    repairReasonsList,
    selectedScrapReason,
    finishedAmount,
    setFinishedAmount,
    scrapAmount,
    setScrapAmount,
    productCount,
    setProductCount,
    repairAmount,
    setRepairAmount,
    retryAction,
    setRetryAction,
    repairReasons,
    setRepairReasons,
    user,
    userInfo,
    dispatch,
    areaName,
    setSelectedArea,
    selectedArea,
    setDesc
  };
};
