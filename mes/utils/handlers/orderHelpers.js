import { setUserIdPopup } from "@/redux/userSlice";
import { getWorkList } from "@/api/client/cOrderOperations";
import {
  setSelectedOrder,
  getWorksWithoutId,
  getJoinTheField,
} from "@/redux/orderSlice";
import { setUser } from "@/redux/userSlice";

//? Bu işlem, kullanıcı ID'si gerektiren (örneğin buzlama, çekic gibi) ekranlarda çalışır.
export const validateUserPresence = (
  user,
  dispatch,
  retryActionName = null,
  setRetryActionFn = null
) => {
  if (!user || !user.id_dec) {
    dispatch(setUserIdPopup(true));
    if (retryActionName && setRetryActionFn) {
      setRetryActionFn(retryActionName);
    }
    return false;
  }
  return true;
};

//? Başarılı işlem sonrası güncelleme fonksiyonu...
export const refreshAfterSuccessfulOperation = (
  areaName,
  isRequiredUserId,
  userInfo,
  dispatch
) => {
  if (isRequiredUserId) {
    dispatch(getWorksWithoutId({ areaName }));
    dispatch(getJoinTheField({ areaName }));
  } else {
    getWorkList({ areaName, userId: userInfo.id_dec, dispatch });
  }
  dispatch(setSelectedOrder([]));
  dispatch(setUser(null));
};

//? fire girişi popup'ıdna formState i sıfırlayacak fonksiyon...
export const refreshFireFormState = (setFormState) => {
  setFormState({
    orderId: "", // String olarak kalıyor
    goldSetting: 0, // Sayısal başlangıç değeri
    entryGramage: 0.0, // Sayısal başlangıç değeri
    exitGramage: 0.0, // Sayısal başlangıç değeri
    gold_pure_scrap: 0.0, // Sayısal başlangıç değeri
    diffirence: 0.0, // Sayısal başlangıç değeri
  });
};

//? MeasurementDataEntry clean formState
export const refreshMeasurementFormState = (setFormState) => {
  setFormState({
    order_no: "",
    material_no: "",
    operator: "",
    area_name: "",
    entry_measurement: "",
    exit_measurement: "",
    entry_weight_50cm: 0.0,
    exit_weight_50cm: 0.0,
    data_entry_date: "",
    description: "",
    measurement_package: 0.0,
  });
};
