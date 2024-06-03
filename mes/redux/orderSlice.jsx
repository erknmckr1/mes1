import { createSlice } from "@reduxjs/toolkit";

const orderSlice = createSlice({
    name:"order",
    initialState:{
        selectedOrder:null,
    },
    reducers:{
        setSelectedOrder:((state,action)=>{
            state.selectedOrder = action.payload;
        })
    }

})

export const {setSelectedOrder} = orderSlice.actions;
export default orderSlice.reducer;