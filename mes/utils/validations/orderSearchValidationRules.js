import { toast } from "react-toastify";

// Proses Order ve Makine kontrolü
export const isValidProcessAndMachine = ({
  selectedMachine,
  selectedHammerSectionField,
  areaName,
  selectedProcess,
  orderId,
  dispatch,
  setUser,
  setSelectedPartners
}) => {
  const isMachineEmpty = Object.keys(selectedMachine).length === 0;
  const isHammerSectionField =
    areaName === "cekic" && selectedHammerSectionField === "makine";
  const screens = ["telcekme", "buzlama", "kurutiras"];
  const isScreen = screens.includes(areaName);

  if (!orderId) {
    toast.error("Sipariş no giriniz...");
    return false;
  }

  if (isScreen || isHammerSectionField) {
    if (!selectedProcess || isMachineEmpty) {
      toast.error("Siparişi başlatmak için makine ve proses seçiniz.");
      dispatch(setSelectedPartners([]));
      dispatch(setUser(null));
      return false;
    }
  }

  if ((areaName === "kalite" || areaName === "cila") && !selectedProcess) {
    toast.error("Siparişi başlatmak için proses seçiniz.");
    dispatch(setUser(null));
    return false;
  }

  if (areaName === "cekic" && !selectedHammerSectionField) {
    toast.error("Sipariş okutmadan önce alan seçimi yapınız.");
    return false;
  }

  return true;
};

// Cila için bir proseste sadece bir iş kontrolunu yapacak fonksıyon...
export const checkCilaDuplicateOrder = ({
  areaName,
  workList,
  selectedProcess,
}) => {
  if (areaName === "cila") {
    const existing = workList.find(
      (order) => order.process_id === selectedProcess?.process_id
    );
    if (existing) {
      toast.error("Bu proses için zaten bir sipariş okutulmuş.");
      return true;
    }
  }
  return false;
};
