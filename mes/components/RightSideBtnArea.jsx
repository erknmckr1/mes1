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
    read_order,
    stopReasonPopup 
  } = useSelector((state) => state.order);

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
          handleOpenStopPopup("group");
          break;
        case "openMeasurementPopup":
          handleOpenMeasurementPopup();
          break;
        case "joinTheSection": // TASLAMA
          joinTheSection();
          break;
        default:
          break;
      }
      setRetryAction(null); // İşlem tetiklendikten sonra sıfırla
    }
  }, [retryAction, user]);
  console.log(stopReasonPopup,retryAction)
  // stop popup'ı aç
  const handleOpenStopPopup = (actionType) => {
    // grub secılı mı ?
    if (selectedGroupNo.length <= 0 && actionType === "group") {
      toast.error("Durduracağınız grubu seçin.");
      return;
    }
    // grup aktif  mi ?
    if (selectedGroupNo[0]?.group_status !== "3" && actionType === "group") {
      toast.error("Durdurmak için devam eden bir grup seçin");
      return;
    }
    if (actionType === "group") {
      if (!user || !user.id_dec) {
        // Eğer kullanıcı ID yoksa, pop-up aç
        setRetryAction("handleOpenStopPopup"); // Parametreyi kaydediyoruz
        dispatch(setUserIdPopup(true));
        return;
      }
      if (
        selectedGroupNo.length === 1 &&
        selectedGroupNo[0].group_status === "3"
      ) {
        dispatch(setStopReasonPopup({ visible: true, actionType }));
      } else if (selectedGroupNo.length > 1) {
        toast.error("Durdurmak için sadece bir grup seçin.");
      } else {
        toast.error("Aktif bir grup seçin.");
      }
    } else if (actionType === "order") {
      if (selectedOrder.length === 1 && selectedOrder[0].work_status === "1") {
        dispatch(setStopReasonPopup({ visible: true, actionType }));
      } else if (selectedOrder.length > 1) {
        toast.error("Durdurmak için sadece bir sipariş seçin.");
      } else {
        toast.error("Aktif bir sipariş seçin.");
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

  //! Seçili ve durdurulmus siparişi yeniden baslat...
  const restartWork = async () => {
    try {
      if (selectedOrder.length === 1 && selectedOrder[0].work_status === "2") {
        if (confirm("İş tekrardan baslatilsin mi ? ")) {
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/restartWork`,
            {
              work_log_uniq_id: selectedOrder[0].uniq_id,
              currentUser: userInfo.id_dec,
              startedUser: selectedOrder[0].user_id_dec,
              selectedOrder: selectedOrder[0],
            }
          );

          if (response.status === 200) {
            if (areaName === "kalite") {
              getWorkList({ areaName, userId: userInfo.id_dec, dispatch });
            } else if (areaName === "buzlama") {
              dispatch(getWorksWithoutId({ areaName }));
            } else {
              getWorkList({ areaName, userId: userInfo.id_dec, dispatch });
            }
            toast.success("Tekrardan başlatma işlemi başarılı.");
            dispatch(setSelectedOrder([]));
          }
        }
      } else if (selectedOrder.length > 1) {
        toast.error("Yenıden baslatmak ıcın sadece 1 durdurulmus iş seçiniz.");
      } else {
        toast.error("Durdurulmuş bir iş seçiniz...");
      }
    } catch (err) {
      console.log(err);
      toast.error("İşlem başarısız oldu.");
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

  // iş bitirme popını acacak...
  const handleOpenFinishedPopup = () => {
    if (
      (selectedOrder.length === 1 && selectedOrder[0]?.work_status === "1") ||
      selectedOrder[0]?.work_status === "2"
    ) {
      dispatch(setFinishedWorkPopup(true));
    } else {
      toast.error("Bitireceğiniz siparişi seçiniz.");
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
      if (selectedOrder.length === 1) {
        if (confirm("Sipariş iptal edilsin mi ?")) {
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/cancelWork`,
            {
              uniq_id: selectedOrder[0].uniq_id,
              currentUser: userInfo.id_dec,
            }
          );
          if (response.status === 200) {
            toast.success(
              `${selectedOrder[0]?.uniq_id} numaralı sipariş iptal edildi...`
            );
            dispatch(setSelectedOrder([]));
            if (areaName === "kalite") {
              getWorkList({ areaName, userId: userInfo.id_dec, dispatch });
            } else if (areaName === "buzlama") {
              dispatch(getWorksWithoutId({ areaName }));
            } else {
              getWorkList({ areaName, userId: userInfo.id_dec, dispatch });
            }
          }
        }
      } else {
        toast.error("İptal etmek için sadece 1 sipariş seçin");
      }
    } catch (err) {
      console.log(err);
      toast.error("Sipariş iptal edilemedi. Lütfen tekrar deneyin.");
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
      dispatch(setUser(null));
    }
  };

  //! makineyi başlatacak query...
  async function startToProcess() {
    const id_dec = user && user.id_dec;
    const group = selectedGroupNo[0]; // Sadece ilk grup numarasını alıyoruz

    if (selectedGroupNo.length > 1 || selectedGroupNo.length === 0) {
      toast.error("Başlatmak için sadece bir makine seçin...");
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
      dispatch(setSelectedGroupNos([])); // Seçilen grup temizleniyor
      dispatch(setFilteredGroup([])); // Filtrelenmiş grup temizleniyor
      dispatch(setSelectedProcess("")); // Proses seçimi temizleniyor
      dispatch(setSelectedMachine("")); // Makine seçimi temizleniyor
      dispatch(handleGetGroupList());
      dispatch(setUser(null));
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

    if (selectedGroupNo && selectedGroupNo.length === 1) {
      dispatch(setMeasurementPopup(true));
    } else {
      toast.error("Veri girişi yapmak istediğiniz grubu seçin");
      dispatch(setUser(null));
    }
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
      // Eğer kullanıcı ID yoksa, pop-up aç
      dispatch(setUserIdPopup(true));
      setRetryAction("joinTheSection");
      return; // ID kontrolü yapılmadan önce işleme devam edilmemeli
    }

    if (!selectedHammerSectionField) {
      toast.error("Katılacagınız bolumu seciniz.");
      dispatch(setUser(""));
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/join-section`,
        {
          section,
          areaName,
          user_id: user.id_dec,
          field: selectedHammerSectionField,
        }
      );
      if (response.status === 200) {
        toast.success("Bölüme katılma işlemi başarıyla gerçekleştirildi.");
        dispatch(setUser(""));
        dispatch(getJoinTheField({ areaName }));
      }
    } catch (err) {
      console.log(err);
      toast.error(err.response.data);
      dispatch(setUser(""));
    }
  };
  //! operatoru bolumden cıkarak query...
  const exitTheField = async () => {
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/exit-section`,
        {
          selectedPersonInField,
          areaName,
          selectedHammerSectionField,
        }
      );
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
      if (!read_order) {
        toast.error("Setup başlatacağınız siparişi okutunuz.");
        return;
      }
      if (!selectedProcess || !selectedMachine) {
        toast.error("Setup başlatmak için proses ve makine seçimi yapınız.");
        return;
      }
      const work_info = {
        user_id_dec: userInfo.id_dec,
        op_username: userInfo.op_username,
        order_id: read_order?.ORDER_ID, // response'dan gelen sipariş bilgileri kullanılıyor
        section,
        area_name: areaName,
        work_status: "6",
        process_id: selectedProcess?.process_id,
        process_name: selectedProcess?.process_name,
        production_amount: read_order?.PRODUCTION_AMOUNT,
      };

      const workLogResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/createWorkLog`,
        { work_info, field: selectedHammerSectionField }
      );

      if (workLogResponse.status === 200) {
        toast.success("Setup başlatıldı.");
        dispatch(getWorksWithoutId({ areaName }));
        dispatch(setSelectedProcess(""));
        dispatch(setSelectedMachine(""));
      }
    } catch (err) {
      console.log(err);
    }
  };
  //! setup ı bıtırecek işi baslatacak  fonksiyon... 
  const finishedToStop = async () => {
    const onGoingOrder = selectedOrder.every(
      (item) => item.work_status === "6"
    );
     
    if (selectedOrder.length <= 0) {
      toast.error("Setup ı bıtırıp baslatacagınız siparişi seçiniz.");
      dispatch(setUser(null));
      return;
    }
    if(!onGoingOrder){
      toast.error("Seçilen sipariş setup a başlanmıs bir sipariş olmalıdır.");
      return
    }
   
    try {

      const work_info = {
        user_id_dec: userInfo.id_dec,
        op_username: userInfo.op_username,
        order_id: selectedOrder[0].order_no, // response'dan gelen sipariş bilgileri kullanılıyor
        section,
        area_name: areaName,
        work_status: "1",
        process_id: selectedProcess?.process_id,
        process_name: selectedProcess?.process_name,
        production_amount: selectedOrder[0].production_amount,
        uniq_id:selectedOrder[0].uniq_id,
      };

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/finishedToSetup`,
        {
          work_info
        }
      );

      if(response.status === 200){
        toast.success("Setup bitirildi. Sipariş başlatıldı.");
        dispatch(getWorksWithoutId({ areaName }));
        dispatch(setSelectedOrder([]));
      }
    
    } catch (err) {
      console.log(err);
      toast.error(err?.response.data);
    }
  }
  //? CEKİC EKRANI METOTLARI BİTİS...

  // Kalite buttons
  const buttons_r = [
    {
      onClick: () => handleOpenStopPopup("order"),
      children: "Siparişi Durdur",
      type: "button",
      className: "w-[200px]",
      disabled: isCurrentBreak,
    },
    {
      onClick: restartWork,
      children: "Yeniden Başlat",
      type: "button",
      className: "w-[200px]",
      disabled: isCurrentBreak,
    },
    {
      onClick: handleOpenFinishedPopup,
      children: "Prosesi Bitir",
      type: "button",
      className: "w-[200px]",
      disabled: isCurrentBreak,
    },
    {
      onClick: handleCancelWork,
      children: "Sipariş İptal",
      type: "button",
      className: "w-[200px] bg-red-600",
      disabled: isCurrentBreak,
    },
  ];
  // buzlama da kullanılan btn...
  const buttons_rtwo = [
    {
      onClick: handleOpenGroupManagementPopup,
      children: "Grup Yönetimi",
      type: "button",
      className: "w-[140px] sm:px-1 sm:py-4  text-sm",
      disabled: isCurrentBreak,
    },
    {
      onClick: handleDeliverGroup,
      children: "Grubu Teslim Et",
      type: "button",
      className:
        "w-[140px] sm:px-1 sm:py-4  text-sm bg-red-600 hover:bg-red-500",
      disabled: isCurrentBreak,
    },
    {
      onClick: handleSendToMachine, // Gönderme işlemi
      children: "Makineye Gönder",
      type: "button",
      className: "w-[140px] sm:px-1 sm:py-4  text-sm",
      disabled: isCurrentBreak,
    },

    {
      onClick: handleFinishGroup,
      children: "Prosesi Bitir",
      type: "button",
      className:
        "w-[140px] sm:px-1 sm:py-4 text-sm bg-red-600 hover:bg-red-500",
      disabled: isCurrentBreak,
    },
    {
      onClick: startToProcess, // Gönderme işlemi
      children: "Prosese Başla",
      type: "button",
      className:
        "w-[140px] bg-green-500 hover:bg-green-600 sm:px-1 sm:py-4  text-sm",
      disabled: isCurrentBreak,
    },
    {
      onClick: () => handleOpenStopPopup("group"),
      children: "Makineyi Durdur",
      type: "button",
      className:
        "w-[140px] sm:px-1 sm:py-4 text-sm bg-red-600 hover:bg-red-500",
      disabled: isCurrentBreak,
    },
    {
      onClick: restartToMachine,
      children: "Yeniden Başlat",
      type: "button",
      className: "w-[140px] sm:px-1 sm:py-4  text-sm",
      disabled: isCurrentBreak,
    },
    {
      onClick: handleOpenConditionalFinishPopup,
      children: "Seçilenleri Ş. Bitir",
      type: "button",
      className:
        "w-[140px] sm:px-1 sm:py-4  text-sm bg-red-600 hover:bg-red-500 ",
      disabled: isCurrentBreak,
    },
    {
      onClick: handleSendRepeatMachine,
      children: "Yeni Makine",
      type: "button",
      className:
        "w-[140px] sm:px-1 sm:py-4  text-sm  text-sm bg-green-600 hover:bg-green-500",
      disabled: isCurrentBreak,
    },
    {
      onClick: finishSelectedOrder,
      children: "Seçilenleri Bitir",
      type: "button",
      className:
        "w-[140px] sm:px-1 sm:py-4  text-sm bg-red-600 hover:bg-red-500",
      disabled: isCurrentBreak,
    },
    {
      children: "Ölçüm V. Girişi",
      type: "button",
      className:
        "w-[140px] sm:px-1 sm:py-4  text-sm  text-sm bg-orange-500 hover:bg-orange-600",
      disabled: isCurrentBreak,
      onClick: handleOpenMeasurementPopup,
    },
    {
      onClick: cancelOrdersInGroup,
      children: "Sipariş İptal",
      type: "button",
      className:
        "w-[140px] sm:px-1 sm:py-4  text-sm  text-sm bg-red-600 hover:bg-red-500",
      disabled: isCurrentBreak,
    },
  ];

  const cekic_buttons = [
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
      className: "w-[140px] hover:bg-green-500 bg-green-600 sm:px-1 sm:py-4 text-sm",
      disabled: isCurrentBreak,
    },
    {
      onClick: handleOpenFinishedPopup,
      children: "Prosesi Bitir",
      type: "button",
      className: "w-[140px] sm:px-1 hover:bg-red-500 bg-red-600 sm:py-4 text-sm",
      disabled: isCurrentBreak,
    },
    {
      onClick: handleCancelWork,
      children: "Sipariş İptal",
      type: "button",
      className: "w-[140px] sm:px-1 hover:bg-red-500 bg-red-600 sm:py-4 text-sm",
      disabled: isCurrentBreak,
    },
    {
      onClick: joinTheSection,
      children: "Bölüme Katıl",
      type: "button",
      className: "w-[140px] hover:bg-green-500 bg-green-600 sm:px-1 sm:py-4 text-sm",
      disabled: isCurrentBreak,
    },
    {
      onClick: exitTheField,
      children: "Bölümden Ayrıl",
      type: "button",
      className:
        "w-[140px] hover:bg-red-500 bg-red-600 sm:px-1 sm:py-4 text-sm",
      disabled: isCurrentBreak,
    },
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
            className:
              "w-[140px] sm:px-1 sm:py-4 text-sm",
            disabled: isCurrentBreak,
          },
        ]
      : []),
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
    if (areaName === "kalite" || areaName === "kurutiras") {
      return (
        <div className="w-full flex flex-col gap-y-5 justify-center items-center ">
          {buttons_r.map((button, index) => (
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
      );
    } else if (areaName === "cekic") {
      return (
        <div className="">
          <div className="w-full grid grid-cols-2 gap-1">
            {cekic_buttons.map((button, index) => (
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
                disabled={isCurrentBreak}
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
