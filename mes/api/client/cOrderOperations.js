// api.js
import axios from 'axios';
import { toast } from 'react-toastify';
import { setWorkList } from '@/redux/orderSlice';

//! mevcut ıslerı cekecek fonksıyon...

export const getWorkList = async (areaName, dispatch) => {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/getWorks`,
      { params: { area_name: areaName } }
    );
    if (response.status === 200) {
      dispatch(setWorkList(response.data));
    }
  } catch (err) {
    console.log(err);
    toast.error("İş bilgileri çekilemedi...");
  }
};
