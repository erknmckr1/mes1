import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCreateLeavePopup,setSelectedFlow } from "@/redux/globalSlice";
import { setUser, setUserIdPopup } from "@/redux/userSlice";
import Button from "@/components/ui/Button";
import LeaveManagement from "../LeaveManagement";
import { IoClose } from "react-icons/io5"; // Kapatma ikonu
function CreateLeavePopup() {
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();
    const { selectedFlow } = useSelector((state) => state.global);
  const handleClosePopup = () => {
    dispatch(setCreateLeavePopup(false));
    dispatch(setUserIdPopup(false));
    dispatch(setUser(null));
    dispatch(setSelectedFlow("İzin Talebi Oluştur"));
  };

  const handleSelection = (item) => {
    dispatch(setSelectedFlow(item));
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
          className="absolute top-3  bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition duration-300"
          title="Kapat"
        >
          <IoClose size={24} />
        </button>
        {/* Butonlar için kapsayıcı div */}
        <div className="absolute z-50  right-3 flex flex-col gap-1">
         {(user.roleId === 4 || user.roleId === 2) && <Button
            onClick={() => handleSelection("İzin Talebi Onayla")}
            className={`${selectedFlow === "İzin Talebi Onayla" ? "bg-[#e67e22]" : ""} bg-blue-500 hover:bg-blue-600 text-white p-2 transition duration-300`}
          >
            İzin Talebi Onayla
          </Button>}
          <Button
            onClick={() => handleSelection("İzin Talebi Oluştur")}
            className={`${selectedFlow === "İzin Talebi Oluştur" ? "bg-[#e67e22]" : ""} bg-blue-500 hover:bg-blue-600 text-white p-2 transition duration-300`}
          >
            İzin Talebi Oluştur
          </Button>
        </div>

        {/* İzin Yönetim İçeriği */}
        <LeaveManagement />
      </div>
    </div>
  );
}

export default CreateLeavePopup;
