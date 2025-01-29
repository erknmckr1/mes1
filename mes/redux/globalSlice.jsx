import { createSlice } from "@reduxjs/toolkit";

const globalSlice = createSlice({
  name: global,
  initialState: {
    foodPopupState: false,
    isMolaPopup: false,
    theme: "dark",
    selectedFlow: "İzin Talebi Oluştur", // Sureclerı belırttımız sidebarda ki secenegı tutacak state...
    returnUrl:"sss",
    isSurveyPopup:false,
    isFirePopup:false,
    isCreateLeavePopup:false
  },
  reducers: {
    setFoodPopupState: (state, action) => {
      state.foodPopupState = action.payload;
    },
    // Ozel ara popunun durumunu tutan state i guncelleyen metot.
    setMolaPopup: (state, action) => {
      state.isMolaPopup = action.payload;
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    setSelectedFlow: (state, action) => {
      state.selectedFlow = action.payload;
    },
    setReturnUrl:(state,action) => {
      state.returnUrl = action.payload;
    },
    setSurveyPopup:(state,action)=>{
      state.isSurveyPopup = action.payload
    },
    // Fire giriş ekranının açılıp kapalı olayını tutacak state...
    setFirePopup:(state,action)=>{
      state.isFirePopup = action.payload
    },
    setCreateLeavePopup:(state,action)=>{
      state.isCreateLeavePopup = action.payload
    }
  },
});

export const {
  setFoodPopupState,
  setOrder,
  setOrderStartsBtnPop,
  setMolaPopup,
  setTheme,
  setSelectedFlow,
  setReturnUrl,
  setSurveyPopup,
  setFirePopup,
  setCreateLeavePopup
} = globalSlice.actions;
export default globalSlice.reducer;
