import { toast } from "react-toastify";
import { areaSelectionConfig } from "../config/areaConfig";
// Bir iş seçildi mi?
export const isNoOrderSelected = (selectedOrder) =>
  !selectedOrder || selectedOrder.length === 0;

// Secılen tum ısler durdurulmus mu ?
export const isAllStopped = (selectedOrder) =>
  selectedOrder.every((item) => item.work_status === "2");

// Multi selected oeprasyon öncesi userId ıstemeyen ekranlarda toplu sıparıse ızın yok 
export const isValidOrderSelectionForRestart = (selectedOrders, areaName) => {
  const isSingleSelectArea = areaSelectionConfig.singleSelect.includes(areaName);
  const isMultiSelectArea = areaSelectionConfig.multiSelect.includes(areaName);

  if (isSingleSelectArea && selectedOrders.length !== 1) {
    return { valid: false, message: "Bu ekranda yalnızca 1 iş yeniden başlatılabilir." };
  }

  if (isMultiSelectArea && selectedOrders.length === 0) {
    return { valid: false, message: "En az bir iş seçmelisiniz." };
  }

  return { valid: true };
};


// Sipariş setup a yollanmıs mı ?
export const isOrderSentToSetup = (selectedOrder) =>
  selectedOrder.some((item) => item.work_status === "6");

// seçilen siparişler aktif mi ?
export const isOrdersActive = (selectedOrder) =>
  selectedOrder.some((item) => item.work_status === "1");
// tamir miktarı girilmişse tamir nedenide seçilmeli...
export const isRepairReasonValid = (repairAmount, repairReasons) => {
  return !(repairAmount > 0 && !repairReasons.some((reason) => reason));
};
// Hurda acıklaması gerekli mi ?
export const isHurdaDescriptionRequired = (
  areaName,
  finishedAmount,
  desc,
  scrapAmount
) => {
  // TELCEKME için özel kontrol
  // if (areaName === "telcekme") {
  //   const scrapThreshold = finishedAmount * 0.1;
  //   return scrapAmount >= scrapThreshold && desc.trim().length === 0;
  // }

  // CİLA dışındaki alanlarda klasik kontrol
  return (
    areaName !== "cila" &&
    areaName !== "telcekme" &&
    finishedAmount >= 100 &&
    desc.trim().length === 0
  );
};

// Okutulan sipariş hatalı mı ?
export const isIncorrectOrderNo = (orderData) => {
  if (!orderData || orderData?.length === 0) {
    toast.error("Okutulan sipariş hatalı, sipariş bulunamadı.");
    return;
  }
};
