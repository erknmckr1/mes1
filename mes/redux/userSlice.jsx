import { createSlice } from "@reduxjs/toolkit";

export const userSlice = createSlice({
  name: "user",
  initialState: {
    userInfo: null,
    operator_id:"",
    onBreak_users:[]
  },
  reducers: {
    setUserInfo: (state, action) => {
      state.userInfo = action.payload;
    },
    setOperatorid:(state,action)=>{
      state.operator_id = action.payload;
    },
    setOnBreakUsers:(state,action)=>{
      state.onBreak_users = action.payload;
    }
  },
});

export const { setUserInfo,setOperatorid,setOnBreakUsers } = userSlice.actions;
export default userSlice.reducer;
