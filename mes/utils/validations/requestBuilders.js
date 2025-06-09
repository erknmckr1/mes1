import { toast } from "react-toastify";
export const buildRestartWorkRequest = ({
  selectedOrders,
  user,
  userInfo,
  areaName,
  field,
  isRequiredUserId,
}) => {
  return {
    work_log_uniq_id: selectedOrders.map((item) => item.uniq_id),
    currentUser: isRequiredUserId ? user.id_dec : userInfo.id_dec,
    startedUser: selectedOrders.map((item) => item.user_id_dec),
    selectedOrders,
    areaName,
    field,
    machine_name: selectedOrders[0]?.machine_name || null,
  };
};

// sipariş baslatmak ıcın query parametresını hazırlayacak fonksıyon...
export const orderSearchBuildWorkInfo = ({
  orderData,
  user,
  userInfo,
  areaName,
  sectionName,
  selectedProcess,
  selectedMachine,
  selectedHammerSectionField,
}) => {
  try {
    const info = {
      user_id_dec: userInfo.id_dec,
      op_username: userInfo.op_username,
      order_id: orderData.ORDER_ID,
      old_code: orderData.OLD_CODE,
      section: sectionName,
      area_name: areaName,
      work_status: "1",
      process_id: selectedProcess?.process_id,
      process_name: selectedProcess?.process_name,
      production_amount: orderData.PRODUCTION_AMOUNT,
      machine_name: selectedMachine?.machine_name,
    };

    if (["buzlama", "telcekme", "kurutiras"].includes(areaName)) {
      info.user_id_dec = user.id_dec;
      info.op_username = user.op_username;
    } else if (areaName === "cekic") {
      info.user_id_dec = user.id_dec;
      info.op_username = user.op_username;
      info.field = selectedHammerSectionField;
      info.work_status = selectedHammerSectionField === "makine" ? "0" : "1";
    }

    return info;
  } catch (error) {
    toast.error("Work bilgisi oluşturulamadı.");
    return null;
  }
};
