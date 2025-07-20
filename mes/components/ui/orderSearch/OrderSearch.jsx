import React from "react";
import Input from "../Input";
import useOrderSearchLogic from "./useOrderSearchLogic";
import { useState } from "react";
import { useMultiOrderScanner } from "./hooks/useMultiOrderScanner";
import ScannedOrderList from "./ScannedOrderList";
import { useSelector } from "react-redux";
import { usePathname } from "next/navigation";
function OrderSearch() {
  const { orderId, handleKeyDown, handleChangeOrder, setOrderId } =
    useOrderSearchLogic();
  const [isMultiScan, setIsMultiScan] = useState(false);
  const { addOrder, removeOrder, clearOrders } = useMultiOrderScanner();
  const { scannedOrders } = useSelector((state) => state.order);
  const pathname = usePathname();
  const url = pathname.split("/");
  const areaName = url[3]
  const handleEnter = (e) => {
    if (e.key === "Enter") {
      if (isMultiScan) {
        addOrder(orderId);
        setOrderId("");
        ("");
      } else {
        handleKeyDown(e);
      }
    }
  };
  return (
    <div className="flex flex-col gap-y-2 relative">
      {/* Checkbox: Çoklu Sipariş Modu */}
    { areaName === 'telcekme' &&  <label className="flex gap-x-2" htmlFor="">
        <span className="text-sm text-bold">Çoklu sipariş</span>
        <input type="checkbox" onClick={() => setIsMultiScan(!isMultiScan)} />
      </label>}
      <Input
        addProps={`text-center text-black h-14`}
        placeholder="Sipariş No"
        onChange={(e) => handleChangeOrder(e)}
        onKeyDown={handleEnter}
        value={orderId}
        disabled={false}
      />
      {/* (Debug amaçlı geçici gösterim) */}
      { isMultiScan && scannedOrders?.length > 0 && (
        <ScannedOrderList
          orders={scannedOrders}
          onRemove={removeOrder}
          onClear={clearOrders}
        />
      )}
      {/* <Button children="Numune Yap" /> */}
    </div>
  );
}

export default OrderSearch;
