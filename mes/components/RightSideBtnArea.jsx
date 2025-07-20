import React from "react";
import Button from "./ui/Button";
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import {
  setStopReasonPopup,
  setFinishedWorkPopup,
  setSelectedOrder,
  setMeasurementPopup,
  handleGetGroupList,
  setConditionalFinishPopup,
  setSelectedPersonInField,
  setFinishedPopupMode,
} from "@/redux/orderSlice";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import axios from "axios";
import { getWorkList } from "@/api/client/cOrderOperations";
import { usePathname } from "next/navigation";
import { setUser, setUserIdPopup } from "@/redux/userSlice"; // buzlama gıbı ekranlarda operasyon oncesı ıd sorulacaksa bu state ı kullanıyoruz.
import { setFirePopup } from "@/redux/globalSlice";
import {
  isNoOrderSelected,
  isAllStopped,
  isValidOrderSelectionForRestart,
  isOrderSentToSetup,
  isOrdersActive,
} from "@/utils/validations/operationValidationRules";
import { buildRestartWorkRequest } from "@/utils/validations/requestBuilders";
import {
  validateUserPresence,
  refreshAfterSuccessfulOperation,
} from "@/utils/handlers/orderHelpers";

function RightSideBtnArea() {
  const [retryAction, setRetryAction] = useState(null); // İşlem türü/ismi tutulacak
  const { isCurrentBreak } = useSelector((state) => state.break);
  const {
    selectedOrder,
    selectedProcess,
    selectedMachine,
    selectedHammerSectionField,
    selectedPersonInField,
    workList,
  } = useSelector((state) => state.order);
  const { isRequiredUserId } = useSelector((state) => state.global);
  const { userInfo, user } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const pathName = usePathname();
  const section = pathName.split("/")[2];
  const areaName = pathName.split("/")[3];

  useEffect(() => {
    if (retryAction && user && user.id_dec) {
      switch (retryAction) {
        case "sendToMachine":
          handleSendToMachine();
          break;
        case "restartToMachine":
          restartToMachine();
          break;
        case "cancelOrderInGroup":
          cancelOrdersInGroup();
          break;
        case "sendRepeatMachine":
          handleSendRepeatMachine();
          break;
        case "finishGroup": // status 5
          handleFinishGroup();
          break;
        case "deliverGroup":
          handleDeliverGroup();
          break;
        case "openConditionalFinishPopup":
          handleOpenConditionalFinishPopup();
          break;
        case "finishSelectedOrders":
          finishSelectedOrder();
          break;
        case "restartToMachine":
          restartToMachine();
          break;
        case "handleOpenStopPopup":
          handleOpenStopPopup("order");
          break;
        case "openMeasurementPopup":
          handleOpenMeasurementPopup();
          break;
        case "joinTheSection": // TASLAMA
          joinTheSection();
          break;
        case "restartWork":
          restartWork();
          break;
        case "cancelWork":
          handleCancelWork();
          break;
        case "finishwork":
          handleFinishWork();
          break;
        case "finishedToStop":
          finishedToStop();
          break;
        case "startToSetup":
          startToSetup();
          break;
        case "startToProces":
          startToProces();
          break;
        case "transferOrder":
          transferOrder();
          break;
        default:
          break;
      }
      setRetryAction(null); // İşlem tetiklendikten sonra sıfırla
    }
  }, [retryAction, user]);

  // stop popup'ı aç
  const handleOpenStopPopup = (actionType) => {
    if (
      isRequiredUserId &&
      !validateUserPresence(
        user,
        dispatch,
        "handleOpenStopPopup",
        setRetryAction
      )
    )
      return;

    if (actionType !== "order") {
      toast.error("Geçersiz işlem.");
      dispatch(setUser(null));
      return;
    }

    if (isNoOrderSelected(selectedOrder)) {
      toast.error("Lütfen en az bir sipariş seçin.");
      dispatch(setUser(null));
      return;
    }

    if (!isOrdersActive(selectedOrder)) {
      toast.error("Sadece aktif siparişleri seçin.");
      dispatch(setUser(null));
      dispatch(setSelectedOrder([]));
      return;
    }

    dispatch(setStopReasonPopup({ visible: true, actionType }));
  };

  //! Seçili ve durdurulmuş siparişi yeniden başlat...
  const restartWork = async () => {
    try {
      if (isNoOrderSelected(selectedOrder)) {
        toast.error("Durdurulmuş bir iş seçiniz...");
        return;
      }

      const selectionValidation = isValidOrderSelectionForRestart(
        selectedOrder,
        areaName
      );
      if (!selectionValidation.valid) {
        toast.error(selectionValidation.message);
        return;
      }

      if (!isAllStopped(selectedOrder)) {
        toast.error("Sadece durdurulmuş işleri seçiniz.");
        return;
      }

      if (
        isRequiredUserId &&
        !validateUserPresence(user, dispatch, "restartWork", setRetryAction)
      )
        return;

      if (confirm("İş(ler) tekrardan başlatılsın mı?")) {
        const requestData = buildRestartWorkRequest({
          selectedOrders: selectedOrder,
          user,
          userInfo,
          areaName,
          field: selectedHammerSectionField,
          isRequiredUserId,
        });

        let response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/restartWork`,
          requestData
        );

        if (response.status === 200) {
          refreshAfterSuccessfulOperation(
            areaName,
            isRequiredUserId,
            userInfo,
            dispatch
          );
        }
        toast.success("Tekrardan başlatma işlemi başarılı.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response.data.message || "İşlem başarısız oldu.");
      dispatch(setSelectedOrder([]));
      dispatch(setUser(null));
    }
  };

  // iş bitirme popupını belirli şartlara göre acacak fonksiyon...
  const handleOpenFinishedPopup = () => {
    if (isNoOrderSelected(selectedOrder)) {
      return toast.error("En az bir sipariş seçmelisiniz.");
    }

    // Kalite ekranı için: sadece 1 sipariş ve work_status 1 veya 2 olmalı
    if (areaName === "kalite") {
      const order = selectedOrder[0];
      if (
        selectedOrder.length === 1 &&
        (order?.work_status === "1" || order?.work_status === "2")
      ) {
        dispatch(setFinishedWorkPopup(true));
      } else {
        toast.error(
          "Sadece aktif ya da durdurulmuş 1 sipariş seçerek bitirme yapabilirsiniz."
        );
      }
    } else {
      // Diğer alanlar için: tüm seçilen siparişlerin work_status'u 1 veya 2 olmalı
      const allValid = selectedOrder.every(
        (order) => order?.work_status === "1" || order?.work_status === "2"
      );

      if (allValid) {
        dispatch(setFinishedWorkPopup(true));
      } else {
        toast.error(
          "Seçilen tüm siparişlerin durumu 'aktif' veya 'durdurulmuş' olmalıdır."
        );
      }
    }
  };

  //! Bir ya da birden fazla sipariş iptal edecek fonksiyon, başlatılmadan önce kullanıcıdan id istiyor. Bitirken veri istemediğimiz ekranlarda
  const handleFinishWork = async () => {
    if (isNoOrderSelected(selectedOrder)) {
      toast.error("Bitireceğiniz siparişleri seçin.");
      return;
    }

    // Bu işlem, kullanıcı ID'si gerektiren (örneğin buzlama, çekic gibi) ekranlarda çalışır.
    // Ayrıca `retryAction` olarak işlem adı atanır ki, kullanıcı ID girdikten sonra ilgili işlem tekrar denensin.
    if (
      isRequiredUserId &&
      !validateUserPresence(user, dispatch, "finishwork", setRetryAction)
    )
      return;

    const requestData = {
      uniqIds: selectedOrder.map((order) => order.uniq_id),
      work_finished_op_dec: user.id_dec,
      areaName,
      field: selectedHammerSectionField,
    };

    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/fwork`,
        requestData
      );

      if (response.status === 200) {
        toast.success(`${selectedOrder.length} iş bitirildi.`);
        refreshAfterSuccessfulOperation(
          areaName,
          isRequiredUserId,
          userInfo,
          dispatch
        );
      }
    } catch (err) {
      console.error("İş bitirme hatası:", err);
      toast.error(
        `${err.response.data}` || "Sipariş bitirme sırasında hata olustu."
      );
      dispatch(setUser(null));
      dispatch(setSelectedOrder([]));
    }
  };

  //! Tekli yada coklu ıslemler ıcın ıkı farklı fonksıyon yazdık bunu teke dusur.
  const handleFinishedFunc = () => {
    if (areaName === "telcekme") {
      handleOpenFinishedPopup();
    } else if (isRequiredUserId) {
      handleFinishWork();
    } else {
      handleOpenFinishedPopup();
    }
  };

  // şartlı bıtırme popupını acacak fonksıyon..
  const handleOpenConditionalFinishPopup = () => {
    // Seçilen sipariş kontrolü
    if (isNoOrderSelected(selectedOrder)) {
      toast.error("Şartlı bitirmek istediğiniz siparişleri seçiniz");
      return;
    }

    if (
      isRequiredUserId &&
      !validateUserPresence(user, dispatch, "restartWork", setRetryAction)
    )
      return;
    dispatch(setConditionalFinishPopup(true));
  };

  //! Bir siparişi iptal edecek popup
  const handleCancelWork = async () => {
    try {
      if (isNoOrderSelected(selectedOrder)) {
        toast.error("İptal etmek için en az bir sipariş seçmelisiniz.");
        return;
      }

      // Bu işlem, kullanıcı ID'si gerektiren (örneğin buzlama, çekic gibi) ekranlarda çalışır.
      // Ayrıca `retryAction` olarak işlem adı atanır ki, kullanıcı ID girdikten sonra ilgili işlem tekrar denensin.
      if (
        isRequiredUserId &&
        !validateUserPresence(user, dispatch, "cancelWork", setRetryAction)
      )
        return;

      const requestData = {
        uniq_id: isRequiredUserId
          ? selectedOrder.map((order) => order.uniq_id)
          : selectedOrder[0].uniq_id,
        areaName,
        field: selectedHammerSectionField,
        currentUser: isRequiredUserId ? user.id_dec : userInfo.id_dec,
      };

      if (confirm("Sipariş iptal edilsin mi ?")) {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/cancelWork`,
          requestData
        );
        if (response.status === 200) {
          toast.success(
            isRequiredUserId
              ? `${selectedOrder.length} sipariş başarıyla iptal edildi.`
              : `${selectedOrder[0]?.uniq_id} numaralı sipariş iptal edildi.`
          );
          // İlgili alanların yenilenmesi
          refreshAfterSuccessfulOperation(
            areaName,
            isRequiredUserId,
            userInfo,
            dispatch
          );
        }
      }
    } catch (err) {
      console.error("İş iptal hatası:", err);
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Sipariş iptal edilemedi. Lütfen tekrar deneyin."
      );
      dispatch(setUser(null));
      dispatch(setSelectedOrder([]));
    }
  };

  //! Seçilenleri bitirme isteği... GRUP TANTANASI...
  const finishSelectedOrder = async () => {
    const onGoingOrder = selectedOrder.every(
      (item) => item.work_status === "1" || item.work_status === "2"
    );

    if (selectedOrder.length <= 0) {
      toast.error("Bitireceğiniz siparişi seçiniz");
      dispatch(setUser(null));
      return;
    }

    if (!onGoingOrder) {
      toast.error(
        "Seçtiğiniz bütün siparişler devam eden ya da durdurulmuş olmalı."
      );
      dispatch(setUser(null));
      return;
    }

    // Bu işlem, kullanıcı ID'si gerektiren (örneğin buzlama, çekic gibi) ekranlarda çalışır.
    // Ayrıca `retryAction` olarak işlem adı atanır ki, kullanıcı ID girdikten sonra ilgili işlem tekrar denensin.
    if (
      isRequiredUserId &&
      !validateUserPresence(
        user,
        dispatch,
        "finishSelectedOrders",
        setRetryAction
      )
    )
      return;

    if (confirm("Seçili siparişler bitirilsin mi?")) {
      try {
        const response = await axios.put(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/finishSelectedOrders`,
          {
            orders: selectedOrder,
            id_dec: user.id_dec,
          }
        );

        if (response.status === 200) {
          toast.success(response.data);
          // İlgili alanların yenilenmesi
          refreshAfterSuccessfulOperation(
            areaName,
            isRequiredUserId,
            userInfo,
            dispatch
          );
          dispatch(handleGetGroupList());
        }
      } catch (err) {
        toast.error(
          err.response?.data?.error ||
            "Siparişleri tamamlama işlemi başarısız oldu."
        );
        dispatch(setUser(null));
      }
    }
  };

  // ölçüm veri girişi popup ını açacak fonksıyon...
  const handleOpenMeasurementPopup = () => {
    // Bu işlem, kullanıcı ID'si gerektiren (örneğin buzlama, çekic gibi) ekranlarda çalışır.
    // Ayrıca `retryAction` olarak işlem adı atanır ki, kullanıcı ID girdikten sonra ilgili işlem tekrar denensin.
    if (
      isRequiredUserId &&
      !validateUserPresence(
        user,
        dispatch,
        "openMeasurementPopup",
        setRetryAction
      )
    )
      return;

    dispatch(setMeasurementPopup(true));
  };

  //? TASLAMA METOTLARI...
  // fire popup ı acacak fonksyon
  const handleOpenFirePopup = () => {
    dispatch(setFirePopup(true));
  };
  //? TASLAMA METOTLARI BİTİŞ

  //? CEKİC EKRANI METOTLARI...
  //! Bölüme katılmak için gerekli query...
  const joinTheSection = async () => {
    // Bu işlem, kullanıcı ID'si gerektiren (örneğin buzlama, çekic gibi) ekranlarda çalışır.
    // Ayrıca `retryAction` olarak işlem adı atanır ki, kullanıcı ID girdikten sonra ilgili işlem tekrar denensin.
    if (
      isRequiredUserId &&
      !validateUserPresence(user, dispatch, "joinTheSection", setRetryAction)
    )
      return;

    // Çekiç bölüme katılma şartı
    if (areaName === "cekic" && !selectedHammerSectionField) {
      toast.error("Katılacağınız bölümü seçiniz.");
      dispatch(setUser(""));
      return;
    }

    // tel çekme bölümüne katılacaksa makine seçimi zorunlu
    if (areaName === "telcekme" && !selectedMachine?.machine_name) {
      toast.error("Katılacağınız makineyi seçiniz.");
      dispatch(setUser(""));
      return;
    }

    // Seçilen makineye ait işlerin order_no ve uniq_id'lerini al
    const workData = workList
      .filter((item) => item.machine_name === selectedMachine.machine_name)
      .map((item) => ({
        order_no: item.order_no,
        uniq_id: item.uniq_id,
      }));

    // Eğer seçilen alan "tel çekme" ise ve seçilen makineye ait iş yoksa hata ver
    if (areaName === "telcekme" && workData.length === 0) {
      toast.error("Seçilen makineye ait iş bulunamadı.");
      dispatch(setUser(""));
      return;
    }

    // params
    let requestData = {
      section,
      areaName,
      user_id: user.id_dec,
      field: selectedHammerSectionField,
      machine_name: selectedMachine?.machine_name,
      workIds: workData.map((item) => item.order_no), // order_no'ları gönderiyoruz
      uniqIds: workData.map((item) => item.uniq_id), // uniq_id'leri de gönderiyoruz
    };

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/join-section`,
        requestData
      );

      if (response.status === 200) {
        toast.success("Bölüme katılma işlemi başarıyla gerçekleştirildi.");
        // İlgili alanların yenilenmesi
        refreshAfterSuccessfulOperation(
          areaName,
          isRequiredUserId,
          userInfo,
          dispatch
        );
      }
    } catch (err) {
      console.log(err);
      toast.error(err.response?.data || "Bir hata oluştu.");
      dispatch(setUser(""));
    }
  };
  //! operatoru bolumden cıkarak query...
  const exitTheField = async () => {
    if (!selectedPersonInField) {
      toast.error("Çıkış yapılacak personeli seçiniz.");
      return;
    }
    try {
      let response;
      if (confirm("Personel bölümden çıkartılsın mı?")) {
        response = await axios.put(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/exit-section`,
          {
            selectedPersonInField,
            areaName,
            selectedHammerSectionField,
            machine_name: selectedMachine?.machine_name,
          }
        );
      }

      if (response.status === 200) {
        toast.success("Bölümden cıkıs ıslemı basarılı.");
        dispatch(setSelectedPersonInField(""));
        refreshAfterSuccessfulOperation(
          areaName,
          isRequiredUserId,
          userInfo,
          dispatch
        );
      }
    } catch (err) {
      console.log(err);
    }
  };
  //! setup u baslatacak fonksıyon...
  const startToSetup = async () => {
    try {
      if (isNoOrderSelected(selectedOrder)) {
        toast.error("Setup başlatacağınız siparişleri seçiniz.");
        return;
      }

      // Bu işlem, kullanıcı ID'si gerektiren (örneğin buzlama, çekic gibi) ekranlarda çalışır.
      // Ayrıca `retryAction` olarak işlem adı atanır ki, kullanıcı ID girdikten sonra ilgili işlem tekrar denensin.
      if (
        isRequiredUserId &&
        !validateUserPresence(user, dispatch, "startToSetup", setRetryAction)
      )
        return;

      const workIds = selectedOrder.map((order) => order.uniq_id);

      const workLogResponse = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/start-to-setup`,
        { workIds, operator_id: user.id_dec }
      );

      if (workLogResponse.status === 200) {
        toast.success("Setup başlatıldı.");
        refreshAfterSuccessfulOperation(
          areaName,
          isRequiredUserId,
          userInfo,
          dispatch
        );
      }
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message || // Eğer backend { message: "..."} formatındaysa
        err?.response?.data || // Eğer backend direkt bir string döndüyse
        err?.message || // Axios’un genel hata mesajı
        "Setup başlatılamadı. Lütfen tekrar deneyin."; // fallback

      toast.error(errorMessage);
      dispatch(setSelectedOrder([]));
      dispatch(setUser(null));
    }
  };
  //! setup ı bıtırecek işi baslatacak  fonksiyon...
  const finishedToStop = async () => {
    if (
      isRequiredUserId &&
      !validateUserPresence(user, dispatch, "finishedToStop", setRetryAction)
    )
      return;

    if (isNoOrderSelected(selectedOrder)) {
      toast.error("Setup ı bıtırıp baslatacagınız siparişi seçiniz.");
      dispatch(setUser(null));
      return;
    }
    if (!isOrderSentToSetup(selectedOrder)) {
      toast.error("Seçilen sipariş setup a başlanmıs bir sipariş olmalıdır.");
      return;
    }

    const workIds = selectedOrder.map((order) => order.uniq_id);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/finishedToSetup`,
        { workIds, operator_id: user.id_dec }
      );

      if (response.status === 200) {
        toast.success("Setup bitirildi.");
        refreshAfterSuccessfulOperation(
          areaName,
          isRequiredUserId,
          userInfo,
          dispatch
        );
      }
    } catch (err) {
      console.log(err);
      toast.error(err?.response.data);
      dispatch(setUser(null));
      dispatch(setSelectedOrder([]));
    }
  };

  //! Setup bıtmıs işi baslatacak query...
  const startToProces = async () => {
    if (isNoOrderSelected(selectedOrder)) {
      toast.error("Başlatacağınız siparişleri seçiniz.");
      dispatch(setUser(null));
      return;
    }

    // Bu işlem, kullanıcı ID'si gerektiren (örneğin buzlama, çekic gibi) ekranlarda çalışır.
    // Ayrıca `retryAction` olarak işlem adı atanır ki, kullanıcı ID girdikten sonra ilgili işlem tekrar denensin.
    if (
      isRequiredUserId &&
      !validateUserPresence(user, dispatch, "startToProces", setRetryAction)
    )
      return;

    const workIds = selectedOrder.map((order) => order.uniq_id);
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/startToProces`,
        {
          workIds,
          user_id_dec: user.id_dec,
          area_name: areaName,
          field: selectedHammerSectionField,
        }
      );

      if (response.status === 200) {
        toast.success(response.data || "İşlem başarılı.");
        refreshAfterSuccessfulOperation(
          areaName,
          isRequiredUserId,
          userInfo,
          dispatch
        );
      }
    } catch (error) {
      console.error("Hata:", error);
      toast.error(error.response.data || "İşlem sırasında bir hata oluştu.");
      dispatch(setUser(null));
      dispatch(setSelectedOrder([]));
    }
  };

  //? CEKİC EKRANI METOTLARI BİTİS...

  //! Bir işi başka bir kullanıcıya devredecek query...
  const transferOrder = async () => {
    if (isNoOrderSelected(selectedOrder)) {
      toast.error("Devredeceğiniz siparişi seçiniz.");
      return;
    }

    // Bu işlem, kullanıcı ID'si gerektiren (örneğin buzlama, çekic gibi) ekranlarda çalışır.
    // Ayrıca `retryAction` olarak işlem adı atanır ki, kullanıcı ID girdikten sonra ilgili işlem tekrar denensin.
    if (
      isRequiredUserId &&
      !validateUserPresence(user, dispatch, "transferOrder", setRetryAction)
    )
      return;

    const workIds = selectedOrder.map((order) => order.uniq_id);
    const requestData = {
      workIds,
      user_id_dec: user.id_dec,
      area_name: areaName,
      op_username: user.op_username,
    };

    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/transferOrder`,
        requestData
      );
      if (response.status === 200) {
        toast.success(response.data);
        refreshAfterSuccessfulOperation(
          areaName,
          isRequiredUserId,
          userInfo,
          dispatch
        );
      }
    } catch (err) {
      console.error("Devir işlemi sırasında hata oluştu:", err);
      toast.error(
        err.response?.data.message || "Devir işlemi sırasında hata oluştu."
      );
      dispatch(setUser(null));
      dispatch(setSelectedOrder([]));
    }
  };

  // Kalite buttons || kurutiras || telcekme // cila
  const buttons_r = [
    {
      onClick: restartWork,
      children: "Yeniden Başlat",
      type: "button",
      className: "lg:w-[200px]",
      //   disabled: isCurrentBreak,
    },
    {
      onClick: () => handleOpenStopPopup("order"),
      children: "Siparişi Durdur",
      type: "button",
      className: "w-[130px] lg:w-[200px] bg-red-600 hover:bg-red-500",
      //  disabled: isCurrentBreak,
    },
    {
      onClick: handleFinishedFunc,
      children: "Prosesi Bitir",
      type: "button",
      className: "w-[130px] lg:w-[200px] bg-red-600 hover:bg-red-500",
      //  disabled: isCurrentBreak,
    },
    {
      onClick: handleCancelWork,
      children: "Sipariş İptal",
      type: "button",
      className: "w-[130px] lg:w-[200px] bg-red-600 hover:bg-red-500",
      // disabled: isCurrentBreak,
    },
    areaName === "cila" && {
      onClick: () => {
        if (selectedProcess) {
          dispatch(setFinishedPopupMode("nextProcess")); // ✅ doğru mod adı
          handleOpenFinishedPopup();
        } else {
          toast.error("Lütfen sonraki prosesi seçiniz.");
        }
      },
      children: "Sonraki Proses",
      type: "button",
      className: "w-[130px] lg:w-[200px] bg-orange-500 hover:bg-orange-600",
    },

    isRequiredUserId && {
      onClick: handleOpenMeasurementPopup,
      children: "Ölçüm V. Girişi",
      type: "button",
      className: "w-[130px] lg:w-[200px] bg-orange-500 hover:bg-orange-600",
      // disabled: isCurrentBreak,
    },
  ];
  // buzlama da kullanılan btn...
  const buttons_rtwo = [
    {
      onClick: () => handleOpenStopPopup("group"),
      children: "Makineyi Durdur",
      type: "button",
      className:
        "w-[140px] sm:px-1 sm:py-4 text-sm bg-red-600 hover:bg-red-500",
      // disabled: isCurrentBreak,
    },
    {
      onClick: handleOpenConditionalFinishPopup,
      children: "Seçilenleri Ş. Bitir",
      type: "button",
      className:
        "w-[140px] sm:px-1 sm:py-4  text-sm bg-red-600 hover:bg-red-500 ",
      //disabled: isCurrentBreak,
    },
    {
      onClick: finishSelectedOrder,
      children: "Seçilenleri Bitir",
      type: "button",
      className:
        "w-[140px] sm:px-1 sm:py-4  text-sm bg-red-600 hover:bg-red-500",
      //disabled: isCurrentBreak,
    },
    {
      children: "Ölçüm V. Girişi",
      type: "button",
      className:
        "w-[140px] sm:px-1 sm:py-4  text-sm  text-sm bg-orange-500 hover:bg-orange-600",
      // disabled: isCurrentBreak,
      onClick: handleOpenMeasurementPopup,
    },
  ];

  const cekic_buttons = [
    // selectedHammerSectionField "makine" olduğunda eklenen butonlar
    ...(selectedHammerSectionField === "makine"
      ? [
          {
            onClick: startToSetup,
            children: "Setup Başla",
            type: "button",
            className: "w-[140px] sm:px-1 sm:py-4 text-sm",
            disabled: isCurrentBreak,
          },
          {
            onClick: finishedToStop,
            children: "Setup Bitir",
            type: "button",
            className: "w-[140px] sm:px-1 sm:py-4 text-sm",
            disabled: isCurrentBreak,
          },
          {
            onClick: startToProces,
            children: "Prosese Başla",
            type: "button",
            className: "w-[140px] sm:px-1 sm:py-4 text-sm",
          },
        ]
      : []),
    // areaName === "telcekme" && {
    //   onClick: transferOrder,
    //   children: "Devir Al",
    //   type: "button",
    //   className:
    //     "w-[140px] bg-orange-500 hover:bg-orange-600 sm:py-4 text-sm sm:px-1",
    //   // disabled: isCurrentBreak,
    // },
    {
      onClick: handleFinishedFunc,
      children: "Prosesi Bitir",
      type: "button",
      className:
        "w-[140px] sm:px-1 hover:bg-red-500 bg-red-600 sm:py-4 text-sm",
      disabled: isCurrentBreak,
    },
    {
      onClick: () => handleOpenStopPopup("order"),
      children: "Siparişi Durdur",
      type: "button",
      className:
        "w-[140px] hover:bg-red-500 bg-red-600 sm:px-1 sm:py-4 text-sm",
      disabled: isCurrentBreak,
    },
    {
      onClick: restartWork,
      children: "Yeniden Başlat",
      type: "button",
      className:
        "w-[140px] hover:bg-green-500 bg-green-600 sm:px-1 sm:py-4 text-sm",
      disabled: isCurrentBreak,
    },
    // ✅ Bölüme Katıl → sadece çekic + makine değilken göster
    !(areaName === "cekic" && selectedHammerSectionField === "makine") && {
      onClick: joinTheSection,
      children: "Bölüme Katıl",
      type: "button",
      className:
        "w-[140px] hover:bg-green-500 bg-green-600 sm:px-1 sm:py-4 text-sm",
      disabled: isCurrentBreak,
    },
    !(areaName === "cekic" && selectedHammerSectionField === "makine") && {
      onClick: exitTheField,
      children: "Bölümden Ayrıl",
      type: "button",
      className:
        "w-[140px] hover:bg-red-500 bg-red-600 sm:px-1 sm:py-4 text-sm",
      disabled: isCurrentBreak,
    },
    {
      onClick: handleCancelWork,
      children: "Sipariş İptal",
      type: "button",
      className:
        "w-[140px] sm:px-1 hover:bg-red-500 bg-red-600 sm:py-4 text-sm",
      disabled: isCurrentBreak,
    },
    isRequiredUserId && {
      onClick: handleOpenMeasurementPopup,
      children: "Ölçüm V. Girişi",
      type: "button",
      className:
        "w-[140px] bg-orange-500 hover:bg-orange-600 sm:py-4 text-sm sm:px-1",
      disabled: isCurrentBreak,
    },
  ];

  const taslama_buttons = [
    {
      onClick: handleOpenFirePopup,
      children: "FİRE GİRİŞİ",
      type: "button",
      className: "w-[200px]",
      disabled: isCurrentBreak,
    },
  ];

  //? Route gore section un sağ tarafına farklı yapıda render edecegız.
  const renderButtons = () => {
    if (
      areaName === "kalite" ||
      areaName === "kurutiras" ||
      areaName === "buzlama" ||
      areaName === "cila"
    ) {
      return (
        <div className="w-full flex flex-col gap-y-5 justify-center items-center ">
          {buttons_r.filter(Boolean).map((button, index) => (
            <Button
              key={index}
              className={button.className}
              children={button.children}
              type={button.type}
              onClick={button.onClick}
              disabled={areaName === "kalite" && isCurrentBreak}
            />
          ))}
        </div>
      );
    } else if (areaName === "cekic" || areaName === "telcekme") {
      return (
        <div className="">
          <div className="w-full grid grid-cols-2 gap-1">
            {cekic_buttons.filter(Boolean).map((button, index) => (
              <Button
                key={index}
                className={button.className}
                children={button.children}
                type={button.type}
                onClick={button.onClick}
                // disabled={isCurrentBreak}
              />
            ))}
          </div>
        </div>
      );
    } else if (areaName === "taslama") {
      return (
        <div className="">
          <div className="w-full flex flex-col gap-y-5 justify-center items-center">
            {taslama_buttons.map((button, index) => (
              <Button
                key={index}
                className={button.className}
                children={button.children}
                type={button.type}
                onClick={button.onClick}
                disabled={isCurrentBreak}
              />
            ))}
          </div>
        </div>
      );
    } else {
      // Diğer areaName'ler için farklı yapı döndürebilirsiniz.
      return (
        <div className="">
          <div className="w-full grid grid-cols-2 gap-1">
            {buttons_rtwo.map((button, index) => (
              <Button
                key={index}
                className={button.className}
                children={button.children}
                type={button.type}
                onClick={button.onClick}
                // disabled={isCurrentBreak}
              />
            ))}
          </div>
        </div>
      );
    }
  };

  return renderButtons();
}

export default RightSideBtnArea;
