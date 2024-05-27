import React from "react";
import Input from "./Input";
import Button from "./Button";

function OrderSearch() {

  return (
    <div className="flex flex-col gap-y-2">
      <Input
        addProps="text-center"
        placeholder="Order No"
      />
      <Button children="Numune Yap" />
    </div>
  );
}

export default OrderSearch;
