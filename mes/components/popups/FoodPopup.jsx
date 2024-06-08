import React from "react";
import { useDispatch } from "react-redux";
import { setFoodPopupState } from "@/redux/globalSlice";
function FoodPopup() {
    const dispatch = useDispatch();
    // popup ı kapatacak komponent...
    const handleCloseFoodPopup = () => {
        dispatch(setFoodPopupState(false))
    }
      return (
    <div className="w-screen h-screen top-0 left-0 absolute">
      <div className="flex items-center justify-center w-full h-full  ">
        <div className=" w-[1300px] h-[800px] bg-black p-3 static z-50 rounded-md ">
            <div className="w-full h-full flex justify-center">
            <img className="h-full" src="/MayısYemekMenu.png" alt="" />
            <button onClick={handleCloseFoodPopup} className="absolute top-4 right-36 bg-red-600 p-3 font-semibold text-white hover:bg-red-500">X KAPAT</button>
            </div>    
        </div>
      </div>
      <div className="w-screen h-screen absolute bg-black opacity-85  top-0 left-0"></div> 
    </div>
  );
}

export default FoodPopup;
