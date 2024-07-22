import { createSlice } from "@reduxjs/toolkit";

const workFlowManagementSlice = createSlice({
    name: "flowmanagement",
    initialState: {
          selectedManagement:"",
          selectedLeaveRow:""
    },
    reducers: {
        setSelectedManagement: (state,action) => {
            state.selectedManagement = action.payload;
          },
          setSeletedLeaveRow:(state,action) => {
            state.selectedLeaveRow = action.payload;
          }
    }
})


export const { setSelectedManagement,setSeletedLeaveRow } = workFlowManagementSlice.actions;
export default workFlowManagementSlice.reducer;
