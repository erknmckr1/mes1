import { toast } from "react-toastify";
// Giriş gramajı girilmiş mi ?
export const isEntryGramage = (formState) => {
  if (!formState.entryGramage) {
    toast.error("Giriş  ölçüsünü girip tekrar deneyiniz.");
    return;
  }
};

// İş emri okutulmuş mu ?
export const isReadOrderNo = (allMeasurement) => {
  if (!allMeasurement || allMeasurement.length < 0) {
    toast.error("Güncelleyeceğiniz ölçüm için iş emrini okutunuz.");
    return;
  }
};

// Satır seçilmiş mi ?
export const isSelectedOrder = (selectedRow) => {
  if (!selectedRow || selectedRow.length < 0) {
    toast.error("Güncelleyeceğiniz ölçüm verisini seçiniz.");
    return;
  }
};

// olcum verı gırısınde (measurementData) Kayıt ıstegı valıdasyonları
export const isMeasurementDataEntered = (measurementsInfo) => {
  if (!measurementsInfo.entry_measurement) {
    toast.error("Giriş ölçümü alanı doldurulmalıdır.");
    return false;
  }

  if (!measurementsInfo.entry_weight_50cm) {
    toast.error("Giriş gramajı alanı doldurulmalıdır.");
    return false;
  }

  if (!measurementsInfo.exit_weight_50cm) {
    toast.error("Çıkış gramajı alanı doldurulmalıdır.");
    return false;
  }

  return true; 
};

