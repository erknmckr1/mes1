import { createSlice } from "@reduxjs/toolkit";

const globalSlice = createSlice({
  name: global,
  initialState: {
    foodPopupState: false,
    isMolaPopup: false,
  },
  reducers: {
    setFoodPopupState: (state, action) => {
      state.foodPopupState = action.payload;
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
