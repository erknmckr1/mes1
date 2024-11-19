import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Thunk to fetch shift logs
export const fetchShiftLogs = createAsyncThunk(
  "shift/getShiftLogs",
  async (_, thunkAPI) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/shift/getShiftLogs`
      );
      console.log("Shift Logs API Response:", response.data); // Burada veriyi kontrol edin
      if (Array.isArray(response.data)) {
        return response.data; // Eğer bir dizi ise döndür
      } else {
        return thunkAPI.rejectWithValue("Beklenmeyen veri formatı.");
      }
    } catch (err) {
      console.error("API Hatası:", err);
      return thunkAPI.rejectWithValue("Veri çekilemedi.");
    }
  }
);


export const shiftSlice = createSlice({
  name: "shift",
  initialState: {
    usersOnShifts: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchShiftLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.usersOnShifts = [];
      })
      .addCase(fetchShiftLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.usersOnShifts = action.payload;
      })
      .addCase(fetchShiftLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error("Veri çekme başarısız:", action.payload);
      });
  },
});

export default shiftSlice.reducer;
