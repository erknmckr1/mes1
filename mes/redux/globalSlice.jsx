import { createSlice } from "@reduxjs/toolkit";

const globalSlice = createSlice({
  name: global,
  initialState: {
    foodPopupState: false,
    order: null,
    // Siparişi durdurduktan sonra
    orderStartsPopup: false,
    isMolaPopup: false,
  },
  reducers: {
    setFoodPopupState: (state, action) => {
      state.foodPopupState = action.payload;
    },
    setOrder: (state, action) => {
      state.order = action.payload;
    },
    // Order ıd gırdıkten sonra ekrana gelecek popun durumunu tutan state (ac kapa)
    setOrderStartsBtnPop: (state, action) => {
      state.orderStartsPopup = action.payload;
    },
    // Ozel ara popunun durumunu tutan state i guncelleyen metot.
    setMolaPopup: (state, action) => {
      state.isMolaPopup = action.payload;
    },
  },
});

export const {
  setFoodPopupState,
  setOrder,
  setOrderStartsBtnPop,
  setMolaPopup,
} = globalSlice.actions;
export default globalSlice.reducer;
