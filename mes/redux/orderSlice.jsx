// Sipariş operasyonlarının statelerını tutacak slice.. 


import { createSlice } from "@reduxjs/toolkit";

const orderSlice = createSlice({
  name: "order",
  initialState: {
    selectedOrder: null,
    stopReasonPopup: null,
    cancelReasonPopup:null,
    repairJobPopup:null 
  },
  reducers: {
    setSelectedOrder: (state, action) => {
      state.selectedOrder = action.payload;
    },
    setStopReasonPopup: (state, action) => {
      state.stopReasonPopup = action.payload;
    },
    setCancelReasonPopup: (state,action) => {
      state.cancelReasonPopup = action.payload;
    },
    setRepairJobPopup:(state,action)=>{
      state.repairJobPopup = action.payload;
    }
    
  },
});

export const { setSelectedOrder, setStopReasonPopup,setCancelReasonPopup,setRepairJobPopup } = orderSlice.actions;
export default orderSlice.reducer;
