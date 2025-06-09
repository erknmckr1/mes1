import axios from "axios";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
// Okutulan sipariş bigisini cekecek servis
export const fetchOrderById = (orderId) =>
  axios.get(`${API_BASE}/api/order/getOrderById`, { params: { orderId } });
// Geçmiş olcum verısını getırecek servis
export const fetchScrapMeasure = (order_no) =>
  axios.get(`${API_BASE}/api/order/getScrapMeasure`, { params: { order_no } });
// Yenı kayıt olusturacak servis
export const submitScrapMeasure = (payload) =>
  axios.post(`${API_BASE}/api/order/scrapMeasure`, payload);
// Fire verisini guncelleyecek servis
export const updateScrapMeasure = (payload) =>
  axios.put(`${API_BASE}/api/order/updateMeasure`, payload);
