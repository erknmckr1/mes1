import { useSelector, useDispatch } from "react-redux";
import { useState, useMemo, useRef, useEffect } from "react";
import { setAnalyticFiltersForm } from "@/redux/dashboardSlice";

export default function OrderMultiSelect() {
  const dispatch = useDispatch();
  const dropdownRef = useRef(null);

  const { distincOrdersFromWorkLog } = useSelector((state) => state.order);
  const { analyticFiltersForm } = useSelector((state) => state.dashboard);

  const selectedOrders = useMemo(() => {
    return Array.isArray(analyticFiltersForm?.order_no)
      ? analyticFiltersForm.order_no
      : [];
  }, [analyticFiltersForm?.order_no]);
  console.log(selectedOrders);

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filteredOrders = distincOrdersFromWorkLog?.data?.data?.filter((order) =>
    order.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectedOrder = (orderNo) => {
    const alreadySelected = analyticFiltersForm?.order_no.includes(orderNo);

    const updatedOrders = alreadySelected
      ? analyticFiltersForm.order_no.filter((id) => id !== orderNo)
      : [...analyticFiltersForm?.order_no, orderNo];

    dispatch(
      setAnalyticFiltersForm({
        ...analyticFiltersForm,
        order_no: updatedOrders,
      })
    );
  };

  const handleRemoveOrder = (orderNo) => {
    const already = analyticFiltersForm?.order_no.includes(orderNo);
  };

  console.log(analyticFiltersForm);
  return (
    <div className="relative w-full max-w-md" ref={dropdownRef}>
      <button
        className="w-full border px-3 py-2 rounded text-sm bg-white text-left"
        onClick={() => setOpen(!open)}
      >
        {selectedOrders.length > 0
          ? `${selectedOrders.length} sipariş seçildi`
          : "Sipariş seçin..."}
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-md max-h-60 overflow-y-auto">
          <input
            type="text"
            placeholder="Sipariş ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border-b text-sm"
          />

          <div className="p-2 space-y-1">
            {filteredOrders?.length > 0 ? (
              filteredOrders.map((orderNo) => (
                <div
                  key={orderNo}
                  className={`cursor-pointer px-2 py-1 rounded text-sm ${
                    selectedOrders.includes(orderNo)
                      ? "bg-blue-600 text-white"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => handleSelectedOrder(orderNo)}
                >
                  {orderNo}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">Eşleşme bulunamadı.</p>
            )}
          </div>
        </div>
      )}

      {selectedOrders.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedOrders.map((order) => (
            <div
              key={order}
              className="relative bg-blue-100 text-blue-800 px-4 py-2 rounded text-xs group"
            >
              {order}
              <button
                onClick={() => handleSelectedOrder(order)}
                className="absolute top-0.5 right-1 text-xs text-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
