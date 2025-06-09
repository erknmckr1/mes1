import React from "react";
import Input from "../Input";
import useOrderSearchLogic from "./useOrderSearchLogic";

function OrderSearch() {
  const { orderId, handleKeyDown, handleChangeOrder } = useOrderSearchLogic();
  return (
    <div className="flex flex-col gap-y-2">
      <Input
        addProps={`text-center text-black h-14`}
        placeholder="Sipariş No"
        onChange={(e) => handleChangeOrder(e)}
        onKeyDown={handleKeyDown}
        value={orderId}
        disabled={false}
      />
      {/* <Button children="Numune Yap" /> */}
    </div>
  );
}

export default OrderSearch;
