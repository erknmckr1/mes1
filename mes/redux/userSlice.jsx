import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";

export const userSlice = createSlice({
  name: "user",
  initialState: {
    userInfo: null,
    operator_id:"207927465", // login popup ta kullanıcı ıd sını tuttugumuz state...
    onBreak_users:[], // moladaki kullanıcıları tutacak state
    allUser:[],
    permissions: [], // Kullanıcı izin bilgileri
    user: null ,// Buzlama gıbı ekranlarda bazı operasyonlardan once kullanıcıdan ıd ıstıyoruz...
    userIdPopup:false
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
    },
    setAllUser:(state,action) => {
      state.allUser = action.payload;
    },
    setPermissions: (state, action) => {
      state.permissions = action.payload;
    },
    setUser: (state,action) => {
      state.user = action.payload;
    },
    setUserIdPopup: (state, action) => {
      state.userIdPopup = action.payload;
    },    
  },
});



export const { setUserInfo,setOperatorid,setOnBreakUsers,setAllUser,setPermissions,setUser,setUserIdPopup } = userSlice.actions;

//! Kullanıcının sahıp oldugu ızınlerı al...
export const fetchUserPermissions = (userId) => async (dispatch) => {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/${userId}/permissions`);
    if (response.status === 200) {
      dispatch(setPermissions(response.data));
    }
  } catch (error) {
    console.error("Error fetching user permissions:", error);
  }
};


export default userSlice.reducer;
