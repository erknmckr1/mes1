import { createSlice } from "@reduxjs/toolkit";

const workFlowManagementSlice = createSlice({
    name: "flowmanagement",
    initialState: {
          selectedManagement:"",
          selectedLeaveRow:"",
          records:[],
          filteredText:""
    },
    reducers: {
        setSelectedManagement: (state,action) => {
            state.selectedManagement = action.payload;
          },
          setSeletedLeaveRow:(state,action) => {
            state.selectedLeaveRow = action.payload;
          },
          setSelectedRecords:(state,action) => {
            state.records = action.payload;
          },
          setFilteredText:(state,action) => {
            state.records = action.payload;
          }
    }
})


export const { setSelectedManagement,setSeletedLeaveRow,setSelectedRecords,setFilteredText } = workFlowManagementSlice.actions;
export default workFlowManagementSlice.reducer;
