import React from "react";
import Button from "./ui/Button";
import { useSelector } from "react-redux";
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
} from "@/redux/orderSlice";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import axios from "axios";
import { getWorkList } from "@/api/client/cOrderOperations";
import { usePathname } from "next/navigation";
import { fetchBuzlamaWorks } from "@/redux/orderSlice";

function RightSideBtnArea() {
  const { onBreak_users, loading, error, isCurrentBreak } = useSelector(
    (state) => state.break
  );
  const {
    selectedOrder,
    selectedProcess,
    selectedMachine,
    selectedGroupNo,
    filteredGroup,
    groupList,
  } = useSelector((state) => state.order);

  const { userInfo } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const pathName = usePathname();
  const areaName = pathName.split("/")[3];

  // stop popup'ı aç
  const handleOpenStopPopup = (actionType) => {
    if (actionType === "group") {
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
    }
  };

  // Grup yönetimi popup ını acacak fonksiyon
  const handleOpenGroupManagementPopup = () => {
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
            getWorkList({ areaName, userId: userInfo.id_dec, dispatch });
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

  //! Seçili ve durdurulmus MAKİNEYİ yeniden başlat
  async function restartToMachine() {
    try {
      if (confirm("Makine tekrardan başlatılsın mı ?")) {
        let response;
        if (
          selectedGroupNo &&
          selectedGroupNo.length === 1 &&
          selectedGroupNo[0].group_status === "4"
        ) {
          response = await axios.put(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/restartToMachine`,
            {
              selectedGroup: selectedGroupNo[0],
              id_dec: userInfo?.id_dec,
              area_name: areaName,
            }
          );
        } else {
          toast.error("Sadece 1 durmuş makine seçin.");
          return;
        }

        if (response && response.status === 200) {
          toast.success(response.data);
          getWorkList({
            areaName,
            dispatch,
            userId: userInfo.id_dec,
          });
        }
        dispatch(handleGetGroupList());
        dispatch(setSelectedGroupNos([]));
        dispatch(setFilteredGroup([]));
      }
    } catch (err) {
      console.log(err);
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
    if (selectedOrder.length > 0) {
      dispatch(setConditionalFinishPopup(true));
    } else {
      toast.error("Şartlı bitirmek istediğiniz siparişleri seçiniz");
    }
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
            getWorkList({ areaName, userId: userInfo.id_dec, dispatch });
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

  //! Seçilenleri bitirme isteği...
  const finishSelectedOrder = async () => {
    const onGoingOrder = selectedOrder.every(
      (item) => item.work_status === "1" || item.work_status === "2"
    );

    if (confirm("Seçili siparişler bitirilsin mi ? ")) {
      try {
        if (onGoingOrder) {
          const response = await axios.put(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/finishSelectedOrders`,
            {
              orders: selectedOrder,
              id_dec: userInfo.id_dec,
            }
          );

          if (response.status === 200) {
            toast.success(response.data);
            getWorkList({ areaName, userId: userInfo.id_dec, dispatch });
            dispatch(setSelectedOrder([]));
            dispatch(handleGetGroupList());
          }
        } else {
          toast.error(
            "Seçtiğiniz bütün siparişler devam eden ya da durdurulmuş olmalı."
          );
        }
      } catch (err) {
        toast.error(
          err.response?.data?.error ||
            "Siparişleri tamamlama işlemi başarısız oldu."
        );
      }
    }
  };

  //! Makineye sipariş gönderme (başlatma) fonksiyonu...
  const handleSendToMachine = async () => {
    const group = selectedGroupNo[0]; // Sadece ilk grup numarasını alıyoruz
    const id_dec = userInfo && userInfo.id_dec;
    try {
      if (selectedGroupNo.length > 1 || selectedGroupNo.length === 0) {
        toast.error("Makineye göndermek için sadece bir grup seçiniz");
      } else if (selectedMachine && selectedProcess) {
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
          getWorkList({
            areaName,
            userId: userInfo.id_dec,
            dispatch,
          });
          dispatch(handleGetGroupList());
          dispatch(fetchBuzlamaWorks({ areaName }));
          dispatch(setSelectedGroupNos([]));
          dispatch(setFilteredGroup([]));
          dispatch(setSelectedProcess(""));
          dispatch(setSelectedMachine(""));
        } else {
          toast.error(
            response.data.message || "İşlem sırasında bir hata oluştu."
          );
        }
      } else {
        toast.error("Makine ve Proses seçiniz.");
      }
    } catch (err) {
      console.log(err);
    }
  };

  //! makineyi başlatacak query...
  async function startToProcess() {
    const id_dec = userInfo && userInfo.id_dec;
    const group = selectedGroupNo[0]; // Sadece ilk grup numarasını alıyoruz
    try {
      if (selectedGroupNo.length > 1 || selectedGroupNo.length === 0) {
        toast.error("Başlatmak için sadece bir sipariş seçin...");
      } else {
        const response = await axios.put(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/startToProcess`,
          {
            id_dec,
            group_record_id: group.group_record_id,
          }
        );

        if (response.status === 200) {
          toast.success("Prosesi başlatma işlemi başarılı");
          getWorkList({
            areaName,
            userId: userInfo.id_dec,
            dispatch,
          });
          dispatch(fetchBuzlamaWorks({ areaName }));
          dispatch(handleGetGroupList());
          dispatch(setSelectedGroupNos([]));
          dispatch(setFilteredGroup([]));
        }
      }
    } catch (err) {
      console.log(err);
      toast.error(err.response.data);
    }
  }

  console.log({
    selectedGroupNo: selectedGroupNo,
    filteredGroup: filteredGroup,
    groupList: groupList,
    selectedProcess: selectedProcess,
    selectedMachine: selectedMachine,
  });

  // ölçüm veri girişi popup ını açacak fonksıyon...
  const handleOpenMeasurementPopup = () => {
    dispatch(setMeasurementPopup(true));
  };

  // send machine popup ını acacak fonksıyon...
  // const handleOpenSendMachinePopup = () => {
  //   if (selectedMachine && selectedProcess) {
  //     dispatch(setSendToMachinePopup({ visible: true, actionType: "send" }));
  //     dispatch(handleGetGroupList());
  //   } else {
  //     toast.error("Proses ve Makine seçiniz.");
  //   }
  // };

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
      className: "w-[150px] sm:px-1 sm:py-5  text-sm",
      disabled: isCurrentBreak,
    },
    {
      onClick: handleSendToMachine, // Gönderme işlemi
      children: "Makineye Gönder",
      type: "button",
      className: "w-[150px] sm:px-1 sm:py-5  text-sm",
      disabled: isCurrentBreak,
    },
    {
      onClick: startToProcess, // Gönderme işlemi
      children: "Prosese Başla",
      type: "button",
      className:
        "w-[150px] bg-green-500 hover:bg-green-600 sm:px-1 sm:py-5  text-sm",
      disabled: isCurrentBreak,
    },
    {
      onClick: () =>
        dispatch(
          setSendToMachinePopup({ visible: true, actionType: "finish" })
        ), // Bitirme işlemi
      children: "Grubu Teslim Et",
      type: "button",
      className: "w-[150px] sm:px-1 sm:py-5  text-sm",
      disabled: isCurrentBreak,
    },
    // {
    //   onClick: handleOpenStopPopup,
    //   children: "Siparişi Durdur",
    //   type: "button",
    //   className: "w-[150px] sm:px-1 sm:py-5  text-sm",
    //   disabled: isCurrentBreak,
    // },
    {
      onClick: () => handleOpenStopPopup("group"),
      children: "Makineyi Durdur",
      type: "button",
      className:
        "w-[150px] sm:px-1 sm:py-5 text-sm bg-red-600 hover:bg-red-500",
      disabled: isCurrentBreak,
    },
    {
      onClick: restartToMachine,
      children: "Yeniden Başlat",
      type: "button",
      className: "w-[150px] sm:px-1 sm:py-5  text-sm",
      disabled: isCurrentBreak,
    },
    {
      onClick: handleOpenConditionalFinishPopup,
      children: "Seçilenleri Ş. Bitir",
      type: "button",
      className:
        "w-[150px] sm:px-1 sm:py-5  text-sm bg-red-600 hover:bg-red-500 ",
      disabled: isCurrentBreak,
    },
    {
      onClick: finishSelectedOrder,
      children: "Seçilenleri Bitir",
      type: "button",
      className:
        "w-[150px] sm:px-1 sm:py-5  text-sm bg-red-600 hover:bg-red-500",
      disabled: isCurrentBreak,
    },
    {
      onClick: handleCancelWork,
      children: "Sipariş İptal",
      type: "button",
      className:
        "w-[150px] sm:px-1 sm:py-5  text-sm  text-sm bg-red-600 hover:bg-red-500",
      disabled: isCurrentBreak,
    },
    {
      children: "Ölçüm V. Girişi",
      type: "button",
      className:
        "w-[150px] sm:px-1 sm:py-5  text-sm  text-sm bg-orange-500 hover:bg-orange-600",
      disabled: isCurrentBreak,
      onClick: handleOpenMeasurementPopup,
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
