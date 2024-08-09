import { createSlice } from "@reduxjs/toolkit";

const globalSlice = createSlice({
  name: global,
  initialState: {
    foodPopupState: false,
    isMolaPopup: false,
    theme: "dark",
    selectedFlow: "İzin Talebi Oluştur", // Sureclerı belırttımız sidebarda ki secenegı tutacak state...
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
  },
});

export const {
  setFoodPopupState,
  setOrder,
  setOrderStartsBtnPop,
  setMolaPopup,
  setTheme,
  setSelectedFlow,
} = globalSlice.actions;
export default globalSlice.reducer;
