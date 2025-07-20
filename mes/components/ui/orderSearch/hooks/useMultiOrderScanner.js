
import { toast } from "react-toastify";
import { setScannedOrders, clearScannedOrders } from "@/redux/orderSlice";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
export const useMultiOrderScanner = () => {
  const dispatch = useDispatch();
  const {scannedOrders} = useSelector((state) => state.order);

  // Sipariş ekleme
  const addOrder = (orderNo) => {
    console.log(orderNo)
    if (scannedOrders?.includes(orderNo)) {
      toast.warning("Bu sipariş zaten listede.");
      return;
    }
    dispatch(setScannedOrders([...scannedOrders,orderNo]))
  };

  // Sipariş silme
  const removeOrder = (orderNo) => {
    dispatch(setScannedOrders(scannedOrders.filter((id)=>id !== orderNo)))
  };

  // Tümünü temizle
  const clearOrders = () => {
    dispatch(clearScannedOrders());
  };

  return {
    scannedOrders,
    addOrder,
    removeOrder,
    clearOrders,
  };
};
