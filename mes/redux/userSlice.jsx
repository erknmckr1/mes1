import { createSlice } from "@reduxjs/toolkit";

export const userSlice = createSlice({
  name: "user",
  initialState: {
    userInfo: null,
    operator_id:"207927465", // login popup ta kullanıcı ıd sını tuttugumuz state...
    onBreak_users:[]  // moladaki kullanıcıları tutacak state
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
