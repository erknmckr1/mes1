import { createSlice,createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";


export const fetchOnBreakUsers = createAsyncThunk(
  "fetchBreak",
  async (_, thunkAPI) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/getBreakOnUsers`);
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response.data);
    }
  }
);

const breakSlice = createSlice({
  name: "break",
  initialState: {
    onBreak_users: [],
    loading: false,
    error: null,
    isCurrentBreak:false
  },
  reducers: {
    setİsCurrentBreak:(state,action)=>{
      state.isCurrentBreak = action.payload;
    }
  },
  extraReducers:(builder) => {
    builder
      .addCase(fetchOnBreakUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOnBreakUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.onBreak_users = action.payload;
      })
      .addCase(fetchOnBreakUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {setİsCurrentBreak} = breakSlice.actions;
export default breakSlice.reducer;
