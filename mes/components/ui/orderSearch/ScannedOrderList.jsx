import React from "react";
import { useSelector } from "react-redux";
import useOrderSearchLogic from "./useOrderSearchLogic";

function ScannedOrderList({onRemove, onClear }) {
  const { theme } = useSelector((state) => state.global);
  const { scannedOrders } = useSelector((state) => state.order);
  const { handleCreateOrderBulk } = useOrderSearchLogic();

  return (
    <div
      className={` ${theme} header text-black rounded p-3 space-y-2 shadow absolute z-50 left-0 top-24`}
    >
      <p className="font-bold text-sm">📋 Okutulan Siparişler:</p>

      <ul className="space-y-1 text-sm">
        {scannedOrders.map((order, idx) => (
          <li
            key={idx}
            className={`${theme} header flex justify-between items-center border-b pb-1`}
          >
            <span>{order}</span>
            <button
              className="text-red-500 text-xs"
              onClick={() => onRemove(order)}
            >
              <span className="text-[30px] font-bold">X</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="flex justify-end gap-2 pt-2 text-xs">
        <button
          onClick={() => handleCreateOrderBulk(scannedOrders)}
          className="bg-green-600 text-white px-3 py-1 rounded"
        >
          Tümünü Başlat
        </button>
        <button
          onClick={onClear}
          className="bg-gray-400 text-white px-3 py-1 rounded"
        >
          Listeyi Temizle
        </button>
      </div>
    </div>
  );
}

export default ScannedOrderList;
