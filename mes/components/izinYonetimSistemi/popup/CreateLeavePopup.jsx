import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCreateLeavePopup } from "@/redux/globalSlice";
import { setUser, setUserIdPopup } from "@/redux/userSlice";
import Button from "@/components/ui/Button";
import LeaveManagement from "../LeaveManagement";
import { IoClose } from "react-icons/io5"; // Kapatma ikonu

function CreateLeavePopup() {
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const handleClosePopup = () => {
    dispatch(setCreateLeavePopup(false));
    dispatch(setUserIdPopup(false));
    dispatch(setUser(null));
  };

  return (
    <div className="w-screen h-screen absolute top-0 left-0 flex items-center justify-center">
      {/* Arkaplan */}
      <div className="absolute w-full h-full bg-black opacity-85"></div>

      {/* Popup İçeriği */}
      <div className="relative w-[90%] h-[85%]  shadow-lg rounded-lg p-6 z-50">
        {/* Kapat Butonu */}
        <button
          onClick={handleClosePopup}
          className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition duration-300"
          title="Kapat"
        >
          <IoClose size={24} />
        </button>

        {/* İzin Yönetim İçeriği */}
        <LeaveManagement />
      </div>
    </div>
  );
}

export default CreateLeavePopup;
