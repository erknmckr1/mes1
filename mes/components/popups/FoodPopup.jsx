import React from "react";
import { useDispatch } from "react-redux";
import { setFoodPopupState } from "@/redux/globalSlice";
import { useSelector } from "react-redux";
function FoodPopup() {
  const { theme } = useSelector((state) => state.global);
  const dispatch = useDispatch();
  // popup ı kapatacak komponent...
  const handleCloseFoodPopup = () => {
    dispatch(setFoodPopupState(false));
  };
  return (
    <div className={`fixed w-screen h-screen top-0 left-0 flex items-center justify-center bg-black bg-opacity-75 z-[9999] ${theme === "dark" ? "dark-mode" : "light-mode"}`}>
      {/* Popup İçeriği */}
      <div className="w-[90%] max-w-[1300px] h-[80%] max-h-[800px] popup-content shadow-2xl rounded-xl p-6 relative flex flex-col items-center justify-center">
        {/* Yemek Listesi Görseli */}
        <div className="w-full h-full flex justify-center items-center">
          <img
            className="w-full h-full object-contain rounded-lg"
            src="/MayısYemekMenu.png"
            alt="Yemek Listesi"
          />
        </div>

        {/* Kapat Butonu */}
        <button
          onClick={handleCloseFoodPopup}
          className="absolute top-6 right-6 bg-red-600 text-white font-semibold px-5 py-3 rounded-lg hover:bg-red-500 hover:scale-105 transition-all duration-300 shadow-md"
        >
          ✖
        </button>
      </div>
    </div>
  );
}

export default FoodPopup;
