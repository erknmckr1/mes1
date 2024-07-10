import React from "react";
import { IoReload } from "react-icons/io5";
function ReloadButton({theme}) {
  const handleRefresh = () => {
    window.location.reload();
  };
  return (
    <button className={`${theme} themabtn rounded-md`} onClick={handleRefresh}>
      <IoReload className="w-[50px] h-[50px] text-[30px] " />
    </button>
  );
}

export default ReloadButton;
