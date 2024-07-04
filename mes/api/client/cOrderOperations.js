// api.js
import axios from 'axios';
import { toast } from 'react-toastify';
import { setWorkList } from '@/redux/orderSlice';

// Opsiyonlar nesnesi kullanarak iş listesi çekme fonksiyonu
export const getWorkList = async ({ areaName, userId, dispatch }) => {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/getWorks`,
      { params: { area_name: areaName, user_id_dec: userId } }
    );
    if (response.status === 200) {
      dispatch(setWorkList(response.data));
    }
  } catch (err) {
    console.log(err);
    toast.error("İş bilgileri çekilemedi...");
  }
};
