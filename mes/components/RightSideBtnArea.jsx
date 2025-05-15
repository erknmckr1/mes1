import React from "react";
import Button from "./ui/Button";
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import {
  setStopReasonPopup,
  setFinishedWorkPopup,
  setSelectedOrder,
  setOrderGroupManagement,
  setSendToMachinePopup,
  setMeasurementPopup,
  setFilteredGroup,
  setSelectedGroupNos,
  handleGetGroupList,
  setConditionalFinishPopup,
  setPastGroupOperationsPopup,
  setSelectedProcess,
  setSelectedMachine,
  fetchBuzlamaWorks,
  getWorksWithoutId,
  setSelectedPersonInField,
  setSelectedHammerSectionField,
  getJoinTheField,
} from "@/redux/orderSlice";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import axios from "axios";
import { getWorkList } from "@/api/client/cOrderOperations";
import { usePathname } from "next/navigation";
import { setUser, setUserIdPopup } from "@/redux/userSlice"; // buzlama gıbı ekranlarda operasyon oncesı ıd sorulacaksa bu state ı kullanıyoruz.
import { setFirePopup } from "@/redux/globalSlice";

function RightSideBtnArea() {
  const [retryAction, setRetryAction] = useState(null); // İşlem türü/ismi tutulacak
  const { isCurrentBreak } = useSelector((state) => state.break);
  const {
    selectedOrder,
    selectedProcess,
    selectedMachine,
    selectedGroupNo,
    filteredGroup,
    groupList,
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
        case "startToProcess":
          startToProcess();
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
        case "handleOpenGroupManagementPopup":
          handleOpenGroupManagementPopup();
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

  // stop popup'ı aç asagıdakı fonksıyon gruplu ekranlar için...
  // const handleOpenStopPopup = (actionType) => {
  //   // grub secılı mı ?
  //   if (selectedGroupNo.length <= 0 && actionType === "group") {
  //     toast.error("Durduracağınız grubu seçin.");
  //     return;
  //   }
  //   // grup aktif  mi ?
  //   if (selectedGroupNo[0]?.group_status !== "3" && actionType === "group") {
  //     toast.error("Durdurmak için devam eden bir grup seçin");
  //     return;
  //   }

  //   if(areaName === "buzlama"){
  //     if(!user || !user.id_dec){

  //     }
  //   }

  //   if (actionType === "group") {
  //     if (!user || !user.id_dec) {
  //       // Eğer kullanıcı ID yoksa, pop-up aç
  //       setRetryAction("handleOpenStopPopup"); // Parametreyi kaydediyoruz
  //       dispatch(setUserIdPopup(true));
  //       return;
  //     }
  //     if (
  //       selectedGroupNo.length === 1 &&
  //       selectedGroupNo[0].group_status === "3"
  //     ) {
  //       dispatch(setStopReasonPopup({ visible: true, actionType }));
  //     } else if (selectedGroupNo.length > 1) {
  //       toast.error("Durdurmak için sadece bir grup seçin.");
  //     } else {
  //       toast.error("Aktif bir grup seçin.");
  //     }
  //   } else if (actionType === "order") {
  //     if (selectedOrder.length === 1 && selectedOrder[0].work_status === "1") {
  //       dispatch(setStopReasonPopup({ visible: true, actionType }));
  //     } else if (selectedOrder.length > 1) {
  //       toast.error("Durdurmak için sadece bir sipariş seçin.");
  //     } else {
  //       toast.error("Aktif bir sipariş seçin.");
  //     }
  //   } else {
  //     toast.error("Geçersiz işlem.");
  //     dispatch(setUser(null));
  //   }
  // };

  // stop popup'ı aç
  const handleOpenStopPopup = (actionType) => {
    // Eğer kullanıcı alanı "buzlama" ise ve kullanıcı ID yoksa ID popup'ını aç
    if (isRequiredUserId && (!user || !user.id_dec)) {
      setRetryAction("handleOpenStopPopup"); // İşlem kaydediliyor
      dispatch(setUserIdPopup(true));
      return;
    }

    // Sipariş veya grup seçimine göre kontrol yapalım
    if (actionType === "order") {
      const invalidOrders = selectedOrder.some(
        (item) => item.work_status !== "1"
      );

      if (invalidOrders) {
        toast.error("Sadece aktif siparişleri seçin.");
        dispatch(setUser(null));
        dispatch(setSelectedOrder([]));
      } else if (selectedOrder.length > 0) {
        dispatch(setStopReasonPopup({ visible: true, actionType }));
      } else {
        toast.error("Lütfen en az bir sipariş seçin.");
        dispatch(setUser(null));
      }
    } else {
      toast.error("Geçersiz işlem.");
      dispatch(setUser(null));
    }
  };

  // Grup yönetimi popup ını acacak fonksiyon
  const handleOpenGroupManagementPopup = () => {
    if (!user || !user.id_dec) {
      // Eğer kullanıcı ID yoksa, pop-up aç
      dispatch(setUserIdPopup(true));
      setRetryAction("handleOpenGroupManagementPopup");
      return;
    }
    dispatch(setOrderGroupManagement(true));
    dispatch(handleGetGroupList());
  };

  // Kapanmıs gruplar ıcın ıslem yapılacak popup ı acacak fonksıyon..
  // const handleOpenPastGroupsPopup = () => {
  //   dispatch(setPastGroupOperationsPopup(true));
  // };

  //! Seçili ve durdurulmuş siparişi yeniden başlat...
  const restartWork = async () => {
    try {
      if (selectedOrder.length === 0) {
        toast.error("Durdurulmuş bir iş seçiniz...");
        return;
      }

      // Eğer kalite gibi ekranlardaysak  sadece tek bir iş seçilmesine izin ver
      if (!isRequiredUserId && selectedOrder.length > 1) {
        toast.error("Bu ekranda yalnızca 1 iş yeniden başlatılabilir.");
        return;
      }

      // Seçilen işlerin hepsi durdurulmuş olmalı
      const invalidOrders = selectedOrder.some(
        (item) => item.work_status !== "2"
      );
      if (invalidOrders) {
        toast.error("Sadece durdurulmuş işleri seçiniz.");
        return;
      }

      // Eğer buzlama alanındaysa ve kullanıcı tanımlı değilse, kullanıcı girişi iste
      if (isRequiredUserId && (!user || !user.id_dec)) {
        setRetryAction("restartWork");
        dispatch(setUserIdPopup(true));
        return;
      }

      if (confirm("İş(ler) tekrardan başlatılsın mı?")) {
        let response;
        const requestData = {
          work_log_uniq_id: selectedOrder.map((item) => item.uniq_id), // Birden fazla iş destekleniyor
          currentUser: userInfo.id_dec,
          startedUser: selectedOrder.map((item) => item.user_id_dec), // Birden fazla iş için liste
          selectedOrders: selectedOrder, // Seçili siparişlerin tamamı
          areaName,
          field: selectedHammerSectionField,
          machine_name: selectedMachine?.machine_name,
        };

        if (isRequiredUserId) {
          requestData.currentUser = user.id_dec;
        }

        // API isteği
        response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/restartWork`,
          requestData
        );

        if (response.status === 200) {
          if (areaName === "kalite") {
            getWorkList({ areaName, userId: userInfo.id_dec, dispatch });
          } else if (isRequiredUserId) {
            dispatch(getWorksWithoutId({ areaName }));
            dispatch(getJoinTheField({ areaName }));
          } else {
            getWorkList({ areaName, userId: userInfo.id_dec, dispatch });
          }
          toast.success("Tekrardan başlatma işlemi başarılı.");
          dispatch(setSelectedOrder([]));
          dispatch(setUser(null));
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response.data.message || "İşlem başarısız oldu.");
      dispatch(setSelectedOrder([]));
      dispatch(setUser(null));
    }
  };

  //! Seçili ve durdurulmuş MAKİNEYİ yeniden başlat
  async function restartToMachine() {
    try {
      // Grup seçimi ve grup durumu kontrolü
      if (selectedGroupNo.length !== 1) {
        toast.error("Yeniden baslatacagınız grubu seçin.");
        dispatch(setUser(null));
        return;
      }
      // Grup seçimi ve grup durumu kontrolü
      if (selectedGroupNo.length > 1) {
        toast.error("Sadece 1 grup seçin");
        dispatch(setUser(null));
        return;
      }

      if (selectedGroupNo[0].group_status !== "4") {
        toast.error("Sadece durdurulmuş bir makineyi seçin.");
        dispatch(setUser(null));
        return;
      }

      // Kullanıcı kimliği kontrolü
      if (!user || !user.id_dec) {
        dispatch(setUserIdPopup(true));
        setRetryAction("restartToMachine");
        return; // ID kontrolü yapılmadan önce işleme devam edilmemeli
      }

      // Onay isteği
      if (confirm("Makine tekrardan başlatılsın mı?")) {
        const response = await axios.put(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/restartToMachine`,
          {
            selectedGroup: selectedGroupNo[0],
            id_dec: user.id_dec,
            area_name: areaName,
          }
        );

        if (response && response.status === 200) {
          toast.success(response.data);

          // İlgili alanların yenilenmesi
          if (areaName === "kalite") {
            getWorkList({ areaName, userId: userInfo.id_dec, dispatch });
          } else if (areaName === "buzlama") {
            dispatch(getWorksWithoutId({ areaName }));
          }

          // Seçimler ve kullanıcı sıfırlama
          dispatch(handleGetGroupList());
          dispatch(setSelectedGroupNos([]));
          dispatch(setFilteredGroup([]));
        }
      }
    } catch (err) {
      console.log(err);
      toast.error("Makineyi başlatma sırasında bir hata oluştu.");
    } finally {
      dispatch(setUser(null)); // İşlem sonunda kullanıcıyı sıfırlıyoruz
    }
  }

  // iş bitirme popupını belirli şartlara göre acacak fonksiyon...
  const handleOpenFinishedPopup = () => {
    if (!selectedOrder.length) {
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

  //! Bir ya da birden fazla sipariş iptal edecek fonksiyon, başlatılmadan önce kullanıcıdan id istiyor.
  const handleFinishWork = async () => {
    if (!selectedOrder || selectedOrder.length === 0) {
      toast.error("Bitireceğiniz siparişleri seçin.");
      return;
    }

    if (isRequiredUserId && (!user || !user.id_dec)) {
      setRetryAction("finishwork"); // İşlem kaydediliyor
      dispatch(setUserIdPopup(true));
      return;
    }

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
        dispatch(setSelectedOrder([]));
        dispatch(setUser(null));
        dispatch(getWorksWithoutId({ areaName }));
        dispatch(getJoinTheField({ areaName }));
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
    if (areaName === "telcekme" || areaName === "cekic") {
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
    if (selectedOrder.length <= 0) {
      toast.error("Şartlı bitirmek istediğiniz siparişleri seçiniz");
      return;
    }

    if (!user || !user.id_dec) {
      // Eğer kullanıcı ID yoksa, pop-up aç
      dispatch(setUserIdPopup(true));
      setRetryAction("openConditionalFinishPopup");
      return;
    }
    dispatch(setConditionalFinishPopup(true));
  };

  //! Bir siparişi iptal edecek popup
  const handleCancelWork = async () => {
    try {
      // Seçili sipariş kontrolü
      if (!selectedOrder || selectedOrder.length === 0) {
        toast.error("İptal etmek için en az bir sipariş seçmelisiniz.");
        return;
      }

      if (isRequiredUserId && (!user || !user.id_dec)) {
        setRetryAction("cancelWork");
        dispatch(setUserIdPopup(true));
        return;
      }

      const requestData = {
        uniq_id: isRequiredUserId
          ? selectedOrder.map((order) => order.uniq_id) // Çoklu sipariş için dizi
          : selectedOrder[0].uniq_id, // Tek sipariş için string
        areaName,
        field: selectedHammerSectionField,
        currentUser: userInfo.id_dec,
      };

      if (isRequiredUserId) {
        requestData.currentUser = user.id_dec;
      }

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
          dispatch(setSelectedOrder([]));
          dispatch(setUser(null));
          if (areaName === "kalite") {
            getWorkList({ areaName, userId: userInfo.id_dec, dispatch });
          } else if (isRequiredUserId) {
            dispatch(getWorksWithoutId({ areaName }));
            dispatch(getJoinTheField({ areaName }));
          } else {
            getWorkList({ areaName, userId: userInfo.id_dec, dispatch });
          }
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

  //! Seçili orderı ıptal edecek fonksıyon SADECE GRUPLU EKRANLARDA...
  async function cancelOrdersInGroup() {
    if (selectedOrder.length <= 0) {
      toast.error("İptal edeceğiniz siparişi seçin.");
      dispatch(setUser(null));
      return;
    }

    if (!user || !user.id_dec) {
      // Eğer kullanıcı ID yoksa, pop-up aç
      dispatch(setUserIdPopup(true));
      setRetryAction("cancelOrderInGroup");
      return; // ID kontrolü yapılmadan önce işleme devam edilmemeli
    }

    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/cancelOrderInGroup`,
        {
          orders: selectedOrder,
          id_dec: user.id_dec,
        }
      );

      if (response.status === 200) {
        // Başarı mesajı dönerse bildirim göster
        toast.success(response.data);
        dispatch(setSelectedOrder([]));
        if (areaName === "kalite") {
          getWorkList({ areaName, userId: userInfo.id_dec, dispatch });
        } else if (areaName === "buzlama") {
          dispatch(getWorksWithoutId({ areaName }));
        }
        dispatch(handleGetGroupList());
        dispatch(fetchBuzlamaWorks({ areaName }));
        dispatch(setSelectedGroupNos([]));
        dispatch(setUser(null));
      }
    } catch (error) {
      console.error("Sipariş iptali sırasında hata oluştu:", error);
      dispatch(setUser(null));
      // Hata mesajını daha detaylı gösterebiliriz
      const errorMessage =
        error.response?.data || "Sipariş iptali sırasında hata oluştu.";
      toast.error(errorMessage);
      dispatch(setSelectedOrder([]));
      if (areaName === "kalite") {
        getWorkList({ areaName, userId: userInfo.id_dec, dispatch });
      } else if (areaName === "buzlama") {
        dispatch(getWorksWithoutId({ areaName }));
      }
    }
  }

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

    if (!user || !user.id_dec) {
      // Eğer kullanıcı ID yoksa, pop-up aç
      dispatch(setUserIdPopup(true));
      setRetryAction("finishSelectedOrders");
      return;
    }

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
          if (areaName === "kalite") {
            getWorkList({ areaName, userId: userInfo.id_dec, dispatch });
          } else if (areaName === "buzlama") {
            dispatch(getWorksWithoutId({ areaName }));
          }
          dispatch(setSelectedOrder([]));
          dispatch(handleGetGroupList());
          dispatch(setUser(null));
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

  //! Makineye sipariş gönderme (başlatma) fonksiyonu...
  const handleSendToMachine = async () => {
    // Makine ve proses secılı mı ?
    if (!selectedGroupNo || !selectedProcess || !selectedMachine) {
      toast.error("Makine ve Proses seçiniz.");
      return;
    }

    if (!user || !user.id_dec) {
      // Eğer kullanıcı ID yoksa, pop-up aç
      dispatch(setUserIdPopup(true));
      setRetryAction("sendToMachine");
      return; // ID kontrolü yapılmadan önce işleme devam edilmemeli
    }

    const group = selectedGroupNo[0]; // Sadece ilk grup numarasını alıyoruz
    const id_dec = user && user.id_dec;

    // sadece bir grup mu secılı ?
    if (selectedGroupNo.length > 1 || selectedGroupNo.length === 0) {
      toast.error("Makineye göndermek için sadece bir grup seçiniz");
      return;
    }

    try {
      if (confirm("Grup makineye gönderilsin mi ?")) {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/sendToMachine`,
          {
            group_record_id: group.group_record_id, // Artık JSON değil direkt string
            machine_name: selectedMachine.machine_name,
            process_name: selectedProcess?.process_name,
            process_id: selectedProcess?.process_id,
            id_dec,
          }
        );

        if (response.status === 200) {
          toast.success("Gruba gönderme işlemi başarılı...");
          if (areaName === "kalite") {
            getWorkList({ areaName, userId: userInfo.id_dec, dispatch });
          } else if (areaName === "buzlama") {
            dispatch(getWorksWithoutId({ areaName }));
          }
          dispatch(handleGetGroupList());
          dispatch(fetchBuzlamaWorks({ areaName }));
          dispatch(setSelectedGroupNos([]));
          dispatch(setFilteredGroup([]));
          dispatch(setSelectedProcess(""));
          dispatch(setSelectedMachine(""));
          dispatch(setUser(null));
        } else {
          toast.error(
            response.data.message || "İşlem sırasında bir hata oluştu."
          );
        }
      }
    } catch (err) {
      console.log(err);
      toast.error(err.response.data || "İşlem sırasında bir hata oluştu.");
      dispatch(setUser(null));
    }
  };

  //! makineyi başlatacak query...
  async function startToProcess() {
    const id_dec = user && user.id_dec;
    const group = selectedGroupNo[0]; // Sadece ilk grup numarasını alıyoruz

    if (selectedGroupNo.length > 1 || selectedGroupNo.length === 0) {
      toast.error("Başlatmak için sadece bir grup seçin...");
      dispatch(setUser(null));
      return;
    } else if (group.group_status !== "2") {
      toast.error(
        "Prosesi başlatmak için makineye gönderilmiş bir grup seçin..."
      );
      dispatch(setUser(null));
      return;
    }

    if (!user || !user.id_dec) {
      // Eğer kullanıcı ID yoksa, pop-up aç
      dispatch(setUserIdPopup(true));
      setRetryAction("startToProcess"); // İşlem türünü belirle
      return; // ID kontrolü yapılmadan önce işleme devam edilmemeli
    }

    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/startToProcess`,
        {
          id_dec,
          group_record_id: group.group_record_id,
        }
      );

      if (response.status === 200) {
        toast.success("Prosesi başlatma işlemi başarılı");
        if (areaName === "kalite") {
          getWorkList({ areaName, userId: userInfo.id_dec, dispatch });
        } else if (areaName === "buzlama") {
          dispatch(getWorksWithoutId({ areaName }));
        }
        dispatch(fetchBuzlamaWorks({ areaName }));
        dispatch(handleGetGroupList());
        dispatch(setSelectedGroupNos([]));
        dispatch(setFilteredGroup([]));
        dispatch(setUser(null));
      }
    } catch (err) {
      console.log(err);
      toast.error(err.response.data || "İşlem sırasında bir hata oluştu.");
      dispatch(setUser(null));
    }
  }

  //! Seçili grubu tekrardan makineye yollayacak fonksiyon...
  const handleSendRepeatMachine = async () => {
    if (selectedGroupNo.length <= 0) {
      toast.error("Yeniden baslatacagınız grubu seçin");
      return;
    }
    // Eğer birden fazla grup seçildiyse ya da grup seçilmediyse hata verelim ve fonksiyonu sonlandıralım
    if (selectedGroupNo.length !== 1) {
      toast.error("Sadece bir grup seçmelisiniz.");
      return;
    }

    // Eğer selectedGroupNo dizisi boşsa, hata ver
    if (!selectedGroupNo[0]) {
      toast.error("Geçersiz grup seçimi. Lütfen geçerli bir grup seçin.");
      return;
    }

    const { group_no, group_record_id } = selectedGroupNo[0];
    const { process_name, process_id } = selectedProcess;
    const { machine_name, machine_id } = selectedMachine;

    // Grup durumu kontrolü
    if (selectedGroupNo[0].group_status !== "5") {
      toast.error("Bitmiş bir proses seçiniz.");
      return;
    }

    // Makine ve proses kontrolü
    if (!selectedMachine) {
      toast.error("İşi başlatacağınız makineyi seçiniz.");
      return;
    }

    if (!selectedProcess) {
      toast.error("İşi başlatacağınız prosesi seçiniz.");
      return;
    }

    // Kullanıcı kimliği kontrolü
    if (!user || !user.id_dec) {
      dispatch(setUserIdPopup(true));
      setRetryAction("sendRepeatMachine");
      return; // ID kontrolü yapılmadan önce işleme devam edilmemeli
    }

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/restartGroupProcess`,
        {
          areaName,
          section,
          id_dec: user.id_dec,
          process_id,
          machine_name,
          process_name,
          group_no,
          group_record_id,
        }
      );

      if (response.status === 200) {
        toast.success(response.data);
        if (areaName === "kalite") {
          getWorkList({ areaName, userId: userInfo.id_dec, dispatch });
        } else if (areaName === "buzlama") {
          dispatch(getWorksWithoutId({ areaName }));
        }
        dispatch(setSelectedProcess(""));
        dispatch(setSelectedMachine(""));
        dispatch(setSelectedGroupNos([]));
        dispatch(fetchBuzlamaWorks({ areaName }));
        dispatch(handleGetGroupList());
      } else {
        toast.error(
          response.data.message || "İşlem sırasında bir hata oluştu."
        );
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "İşlem sırasında bir hata oluştu."
      );
    } finally {
      dispatch(setUser(null));
    }
  };

  //! Seçili grubu teslim et...
  const handleFinishGroup = async () => {
    const orders = filteredGroup;
    const groups = selectedGroupNo;
    const id_dec = user && user.id_dec;

    if (groups.length !== 1 || groups[0].group_status === "5") {
      toast.error("Bitirmek istediğiniz sadece aktif 1 grubu seçiniz.");
      return;
    }

    if (!user || !user.id_dec) {
      // Eğer kullanıcı ID yoksa, pop-up aç
      dispatch(setUserIdPopup(true));
      setRetryAction("finishGroup"); // status 5
      return;
    }

    try {
      if (confirm("Grup bitirlsin mi?")) {
        const response = await axios.put(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/finishTheGroup`,
          {
            orders,
            groups,
            id_dec,
          }
        );

        if (response.status === 200) {
          toast.success(response.data);
          if (areaName === "kalite") {
            getWorkList({ areaName, userId: userInfo.id_dec, dispatch });
          } else if (areaName === "buzlama") {
            dispatch(getWorksWithoutId({ areaName }));
          }
          dispatch(setSelectedGroupNos([])); // Seçilen grup temizleniyor
          dispatch(setFilteredGroup([])); // Filtrelenmiş grup temizleniyor
          dispatch(setSelectedProcess("")); // Proses seçimi temizleniyor
          dispatch(setSelectedMachine("")); // Makine seçimi temizleniyor
          dispatch(handleGetGroupList());
          dispatch(setUser(null));
        } else {
          toast.error(
            response.data.message || "İşlem sırasında bir hata oluştu."
          );
          dispatch(setUser(null));
        }
      }
    } catch (err) {
      console.error("Teslim işlemi sırasında hata oluştu:", err);
      toast.error(
        err.response?.data || "Sunucu hatası, lütfen daha sonra tekrar deneyin."
      );
      dispatch(setUser(null));
    }
  };

  //! seçili grubu teslim edecek istek...
  const handleDeliverGroup = async () => {
    if (selectedGroupNo.length !== 1) {
      toast.error("Teslim etmek istediğiniz sadece aktif 1 grubu seçiniz.");
      return;
    }
    if (!user || !user.id_dec) {
      // Eğer kullanıcı ID yoksa, pop-up aç
      dispatch(setUserIdPopup(true));
      setRetryAction("deliverGroup"); // İşlem türünü belirle
      return; // ID kontrolü yapılmadan önce işleme devam edilmemeli
    }
    const id_dec = user && user.id_dec;

    try {
      if (confirm("Grup teslim edilsin mi ?")) {
        const response = await axios.put(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/deliverTheGroup`,
          {
            group: selectedGroupNo[0],
            id_dec,
          }
        );
        if (response.status === 200) {
          toast.success(response.data);
          if (areaName === "kalite") {
            getWorkList({ areaName, userId: userInfo.id_dec, dispatch });
          } else if (areaName === "buzlama") {
            dispatch(getWorksWithoutId({ areaName }));
          }
          dispatch(setSelectedGroupNos([])); // Seçilen grup temizleniyor
          dispatch(setFilteredGroup([])); // Filtrelenmiş grup temizleniyor
          dispatch(setSelectedProcess("")); // Proses seçimi temizleniyor
          dispatch(setSelectedMachine("")); // Makine seçimi temizleniyor
          dispatch(handleGetGroupList());
          dispatch(setUser(null));
        } else {
          toast.error(
            response.data.message || "İşlem sırasında bir hata oluştu."
          );
        }
      }
    } catch (err) {
      console.error("Teslim işlemi sırasında hata oluştu:", err);
      toast.error(
        err.response?.data || "Sunucu hatası, lütfen daha sonra tekrar deneyin."
      );
      dispatch(setUser(null));
      //  dispatch(setSelectedGroupNos([])); // Seçilen grup temizleniyor
      //  dispatch(setFilteredGroup([])); // Filtrelenmiş grup temizleniyor
      dispatch(setSelectedProcess("")); // Proses seçimi temizleniyor
      dispatch(setSelectedMachine("")); // Makine seçimi temizleniyor
      // dispatch(handleGetGroupList());
    }
  };

  // ölçüm veri girişi popup ını açacak fonksıyon...
  const handleOpenMeasurementPopup = () => {
    if (!user || !user.id_dec) {
      // Eğer kullanıcı ID yoksa, pop-up aç
      dispatch(setUserIdPopup(true));
      setRetryAction("openMeasurementPopup"); // İşlem türünü belirle
      return; // ID kontrolü yapılmadan önce işleme devam edilmemeli
    }

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
    if (!user || !user.id_dec) {
      // Kullanıcı ID kontrolü
      dispatch(setUserIdPopup(true));
      setRetryAction("joinTheSection");
      return;
    }
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
        dispatch(setUser(""));
        dispatch(getJoinTheField({ areaName }));
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
        dispatch(getJoinTheField({ areaName }));
      }
    } catch (err) {
      console.log(err);
    }
  };
  //! setup u baslatacak fonksıyon...
  const startToSetup = async () => {
    try {
      if (selectedOrder.length <= 0) {
        toast.error("Setup başlatacağınız siparişleri seçiniz.");
        return;
      }

      if (!user || !user.id_dec) {
        // Eğer kullanıcı ID yoksa, pop-up aç
        dispatch(setUserIdPopup(true));
        setRetryAction("startToSetup");
        return;
      }
      // if (!read_order) {
      //   toast.error("Setup başlatacağınız siparişi okutunuz.");
      //   return;
      // }

      // if (!selectedProcess || !selectedMachine) {
      //   toast.error("Setup başlatmak için proses ve makine seçimi yapınız.");
      //   return;
      // }

      // const work_info = {
      //   user_id_dec: userInfo.id_dec,
      //   op_username: userInfo.op_username,
      //   order_id: read_order?.ORDER_ID, // response'dan gelen sipariş bilgileri kullanılıyor
      //   section,
      //   area_name: areaName,
      //   work_status: "6",
      //   process_id: selectedProcess?.process_id,
      //   process_name: selectedProcess?.process_name,
      //   production_amount: read_order?.PRODUCTION_AMOUNT,
      // };

      const workIds = selectedOrder.map((order) => order.uniq_id);

      const workLogResponse = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/start-to-setup`,
        { workIds, operator_id: user.id_dec }
      );

      if (workLogResponse.status === 200) {
        toast.success("Setup başlatıldı.");
        dispatch(getWorksWithoutId({ areaName }));
        dispatch(setSelectedOrder([]));
        dispatch(setUser(null));
      }
    } catch (err) {
      console.log(err);
      toast.error(err?.response.data);
      dispatch(setSelectedOrder([]));
      dispatch(setUser(null));
    }
  };
  //! setup ı bıtırecek işi baslatacak  fonksiyon...
  const finishedToStop = async () => {
    if (!user || !user.id_dec) {
      // Eğer kullanıcı ID yoksa, pop-up aç
      dispatch(setUserIdPopup(true));
      setRetryAction("finishedToStop");
      return;
    }

    const onGoingOrder = selectedOrder.every(
      (item) => item.work_status === "6"
    );

    if (selectedOrder.length <= 0) {
      toast.error("Setup ı bıtırıp baslatacagınız siparişi seçiniz.");
      dispatch(setUser(null));
      return;
    }
    if (!onGoingOrder) {
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
        dispatch(getWorksWithoutId({ areaName }));
        dispatch(setSelectedOrder([]));
        dispatch(setUser(null));
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
    if (selectedOrder.length <= 0) {
      toast.error("Başlatacağınız siparişleri seçiniz.");
      dispatch(setUser(null));
      return;
    }

    if (!user || !user.id_dec) {
      dispatch(setUserIdPopup(true));
      setRetryAction("startToProces");
      return;
    }

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
        dispatch(getWorksWithoutId({ areaName }));
        dispatch(setSelectedOrder([]));
        dispatch(setUser(null));
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
    if (!selectedOrder || selectedOrder.length === 0) {
      toast.error("Devredeceğiniz siparişi seçiniz.");
      return;
    }

    if (!user || !user.id_dec) {
      dispatch(setUserIdPopup(true));
      setRetryAction("transferOrder");
      return;
    }

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
        dispatch(setSelectedOrder([]));
        dispatch(setUser(null));
        dispatch(getWorksWithoutId({ areaName }));
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

  // Kalite buttons || kurutiras || telcekme
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
      onClick: handleOpenGroupManagementPopup,
      children: "Grup Yönetimi",
      type: "button",
      className: "w-[140px] sm:px-1 sm:py-4  text-sm",
      //  disabled: isCurrentBreak,
    },
    {
      onClick: handleDeliverGroup,
      children: "Grubu Teslim Et",
      type: "button",
      className:
        "w-[140px] sm:px-1 sm:py-4  text-sm bg-red-600 hover:bg-red-500",
      // disabled: isCurrentBreak,
    },
    {
      onClick: handleSendToMachine, // Gönderme işlemi
      children: "Makineye Gönder",
      type: "button",
      className: "w-[140px] sm:px-1 sm:py-4  text-sm",
      // disabled: isCurrentBreak,
    },

    {
      onClick: handleFinishGroup,
      children: "Prosesi Bitir",
      type: "button",
      className:
        "w-[140px] sm:px-1 sm:py-4 text-sm bg-red-600 hover:bg-red-500",
      //disabled: isCurrentBreak,
    },
    {
      onClick: startToProcess, // Gönderme işlemi
      children: "Prosese Başla",
      type: "button",
      className:
        "w-[140px] bg-green-500 hover:bg-green-600 sm:px-1 sm:py-4  text-sm",
      // disabled: isCurrentBreak,
    },
    {
      onClick: () => handleOpenStopPopup("group"),
      children: "Makineyi Durdur",
      type: "button",
      className:
        "w-[140px] sm:px-1 sm:py-4 text-sm bg-red-600 hover:bg-red-500",
      // disabled: isCurrentBreak,
    },
    {
      onClick: restartToMachine,
      children: "Yeniden Başlat",
      type: "button",
      className: "w-[140px] sm:px-1 sm:py-4  text-sm",
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
      onClick: handleSendRepeatMachine,
      children: "Yeni Makine",
      type: "button",
      className:
        "w-[140px] sm:px-1 sm:py-4  text-sm  text-sm bg-green-600 hover:bg-green-500",
      // disabled: isCurrentBreak,
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
    {
      onClick: cancelOrdersInGroup,
      children: "Sipariş İptal",
      type: "button",
      className:
        "w-[140px] sm:px-1 sm:py-4  text-sm  text-sm bg-red-600 hover:bg-red-500",
      //disabled: isCurrentBreak,
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
