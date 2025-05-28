import { useSelector } from "react-redux";
import { useState } from "react";
import { useEffect } from "react";
import axios from "axios";
import { setWorkHistoryData } from "@/redux/orderSlice";
import { useDispatch } from "react-redux";
import { usePathname } from "next/navigation";

const WorkHistoryBox = () => {
  const workHistory = useSelector((state) => state.order.workHistoryData);
  const { selectedOrder } = useSelector((state) => state.order);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dispatch = useDispatch();
  const pathname = usePathname();
  const areaName = pathname.split("/")[3]; // URL'den alan adını al

  // Geçmiş iş verilerini alacak fonksiyon
  const fetchWorkHistory = async (orderNo) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/getWorkHistory`,
        {
          params: { id: orderNo },
        }
      );
      dispatch(setWorkHistoryData(response.data?.data || []));
    } catch (error) {
      console.error("Geçmiş iş verisi alınamadı:", error);
      dispatch(setWorkHistoryData([]));
    }
  };

  // Tıkladıgımız siparişin geçmişini gösterecek useEffect
  useEffect(() => {
    const orderNo = selectedOrder?.[0]?.order_no;
    dispatch(setWorkHistoryData([])); // Önceki verileri temizle
    if (!orderNo) return;
    fetchWorkHistory(orderNo);
  }, [selectedOrder]);

  // Enter ile arama yap...
  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (searchTerm.trim() !== "") {
        fetchWorkHistory(searchTerm);
      } else {
        dispatch(setWorkHistoryData([]));
      }
    }
  };

  return (
    areaName === "cila" && (
      <div className="absolute left-1 top-0 z-50">
        <div className="flex justify-between items-center bg-gray-800 border border-gray-600 rounded-md shadow px-3 py-1 text-white">
          <span className="text-base text-xs font-semibold">İşlem Geç.</span>
          <button
            className="ml-2 bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1 rounded-full"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? "❌" : "👁️"}
          </button>
        </div>

        {isOpen && (
          <div className="mt-2 bg-gray-900 border border-gray-600 rounded-lg shadow-lg p-3 w-[250px] text-sm text-white">
            <input
              type="text"
              className="w-full mb-3 p-2 rounded border border-gray-500 bg-gray-800 text-gray-100 placeholder:text-gray-400"
              placeholder="Sipariş ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={onKeyDown}
            />

            <div className="max-h-[250px] overflow-y-auto space-y-3 pr-1">
              {workHistory.length === 0 ? (
                <p className="text-gray-400 italic">Geçmiş veri bulunamadı.</p>
              ) : (
                workHistory.map((item, index) => (
                  <div
                    key={index}
                    className="bg-gray-700 border border-gray-600 rounded-md p-2"
                  >
                    <p>
                      <strong>Proses:</strong> {item.process_name}
                    </p>
                    <p>
                      <strong>Kullanıcı:</strong>{" "}
                      {item.op_username || item.user_id_dec}
                    </p>
                    <p className="text-gray-300 text-xs">
                      <strong>Tarih:</strong>{" "}
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    )
  );
};

export default WorkHistoryBox;
