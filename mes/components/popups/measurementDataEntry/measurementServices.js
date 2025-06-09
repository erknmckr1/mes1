import axios from "axios";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export const getMaterialMeasureData = (material_no) =>
  axios.get(`${API_BASE}/api/order/getMetarialMeasureData`, {
    params: { metarial_no: material_no },
  });

export const getPreviousMeasurements = (areaName, material_no) =>
  axios.get(`${API_BASE}/api/order/getMeasureWithOrderId`, {
    params: { areaName, material_no },
  });

export const saveMeasurement = (measurementsInfo) =>
  axios.post(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/measurements`,
    measurementsInfo
  );
