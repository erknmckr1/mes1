import { createSlice,createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";


export const fetchOnBreakUsers = createAsyncThunk(
  "fetchBreak",
  async (_, thunkAPI) => {
    try {
      const response = await axios.get("http://localhost:3003/getBreakOnUsers");
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
  },
  reducers: {},
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

export const {} = breakSlice.actions;
export default breakSlice.reducer;
