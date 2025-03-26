import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Thunk: Tüm kullanıcıları getiren API çağrısı
export const fetchAllUsers = createAsyncThunk(
  "user/fetchAllUsers",
  async (_, thunkAPI) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/getAllUsers`
      );
      if (response.status === 200) {
        return response.data;
      } else {
        return rejectWithValue("Kullanıcı verileri çekilemedi");
      }
    } catch (error) {
      console.error("Error fetching all users:", error);
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const userSlice = createSlice({
  name: "user",
  initialState: {
    userInfo: null,
    operator_id: "", // login popup ta kullanıcı ıd sını tuttugumuz state...
    onBreak_users: [], // moladaki kullanıcıları tutacak state
    allUser: [],
    permissions: [], // Kullanıcı izin bilgileri
    user: null, // Buzlama gıbı ekranlarda bazı operasyonlardan once kullanıcıdan ıd ıstıyoruz...
    userIdPopup: false,
    usersByArea: [], // Bölüme göre kullanıcıları tutacak state
    selectedPartners : []
  },
  reducers: {
    setUserInfo: (state, action) => {
      state.userInfo = action.payload;
    },
    setOperatorid: (state, action) => {
      state.operator_id = action.payload;
    },
    setOnBreakUsers: (state, action) => {
      state.onBreak_users = action.payload;
    },
    setAllUser: (state, action) => {
      state.allUser = action.payload;
    },
    setPermissions: (state, action) => {
      state.permissions = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setUserIdPopup: (state, action) => {
      state.userIdPopup = action.payload;
    },
    setUsersByArea: (state, action) => {
      state.usersByArea = action.payload;
    },
    setSelectedPartners: (state, action) => {
      state.selectedPartners = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.allUser = action.payload;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setUserInfo,
  setOperatorid,
  setOnBreakUsers,
  setAllUser,
  setPermissions,
  setUser,
  setUserIdPopup,
  setUsersByArea,
  setSelectedPartners
} = userSlice.actions;

//! Kullanıcının sahıp oldugu ızınlerı al...
export const fetchUserPermissions = (userId) => async (dispatch) => {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/${userId}/permissions`
    );
    if (response.status === 200) {
      dispatch(setPermissions(response.data));
    }
  } catch (error) {
    console.error("Error fetching user permissions:", error);
  }
};

export default userSlice.reducer;
