import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL; // içeri taşıyoruz

//! Tüm makineleri çekecek async thunk
export const fetchMachinesData = createAsyncThunk(
  "dashboardFetch/machines",
  async (process) => {
    console.log("Seçilen proses:", process);
    try {
      const response = await axios.get(
        `${BASE_URL}/api/order/getMachineListInProcess`,
        { params: { process } }
      );
      return response.data;
    } catch (error) {
      console.error("Makine verisi çekilemedi:", error);
      throw new Error("Error fetching machines data");
    }
  }
);

//! Tüm prosesleri çekecek async thunk
export const fetchProcessesData = createAsyncThunk(
  "dashboardFetch/processes",
  async (areaName) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/getProcessInSection`,
        { params: { areaName } }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error fetching processes data");
    }
  }
);

//! Tüm bölümleri çekecek async thunk
export const fetchSectionsData = createAsyncThunk(
  "dasboardFetch/sections",
  async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/getSectionList`
      );
      return response.data;
    } catch (error) {
      throw new Error("Error fetching sections data");
    }
  }
);

//! Seçilen kata göre areaname leri getirecek thunk
export const fetchAreaData = createAsyncThunk(
  "dashboardFetch/area",
  async (section) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/getAreaList`,
        {
          params: { section },
        }
      );
      return response.data;
    } catch (err) {
      console.log(err);
    }
  }
);

const initialState = {
  analyticFiltersForm: {
    section: "",
    areaName: "",
    machine: "",
    prosess: "",
    startDate: "",
    endDate: "",
    dataType: "", // veri çekilecek tablo türü
    order_no: "",
    metarial_no: "",
  },
  dailyChartData: [],
  machineData: [], // makine bılgısını tutacak state
  areaData: [], // birim listesini tutacak state
  processData: [], // process listesini tutacak state
  sectionData: [], // section listesini tutacak state
  dashboardData: null,
  isLoading: false,
  error: null,
  isOpen: false, // chatbox ı acıp kapatacak state
  chatBoxMessage: "", // chatbox a yazılan mesajı tutacak state
  aiChatBoxMessages: [
    { role: "ai", message: "Merhaba! Size nasıl yardımcı olabilirim?" },
  ],
  aiGeneratedQuery: null,
  analyticsData: {
    workStatusData: [],
    machineStatusData: null,
    activeMachineDuration: null,
    repairReasonStats: null,
    stoppedWorkDuration: null,
  },
  exportData: [],
  activeView: "stopped",
  isFilterDataLoading:false
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    setAnalyticFiltersForm: (state, action) => {
      state.analyticFiltersForm = action.payload;
    },
    setDashboardData: (state, action) => {
      state.dashboardData = action.payload;
    },
    setDailyChartData: (state, action) => {
      state.dailyChartData = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setIsOpen: (state, action) => {
      state.isOpen = action.payload;
    },
    setCheckBoxMessage: (state, action) => {
      state.chatBoxMessage = action.payload;
    },
    setAiChatBoxMessages: (state, action) => {
      state.aiChatBoxMessages = action.payload;
    },
    setAiGeneratedQuery: (state, action) => {
      state.aiGeneratedQuery = action.payload;
    },
    setAnalyticsData: (state, action) => {
      const { key, data } = action.payload;
      state.analyticsData[key] = data;
    },
    setActiveView: (state, action) => {
      state.activeView = action.payload;
    },
    setExportData: (state, action) => {
      state.exportData = action.payload;
    },
    setIsFilterDataLoading: (state,action) =>{
      state.isFilterDataLoading = action.payload;
    }
  },
  extraReducers: (builder) => {
    // Makineleri çekerken
    builder
      .addCase(fetchMachinesData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMachinesData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.machineData = action.payload;
      })
      .addCase(fetchMachinesData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      });
    // Prosesleri çekerken
    builder
      .addCase(fetchProcessesData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchProcessesData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.processData = action.payload;
      })
      .addCase(fetchProcessesData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      });
    // Bölümleri çekerken
    builder
      .addCase(fetchSectionsData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchSectionsData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sectionData = action.payload;
      })
      .addCase(fetchSectionsData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      });
    // area ları çekerken
    builder
      .addCase(fetchAreaData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAreaData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.areaData = action.payload;
      })
      .addCase(fetchAreaData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      });
  },
});

export const {
  setAnalyticFiltersForm,
  setDashboardData,
  setDailyChartData,
  setLoading,
  setError,
  setIsOpen,
  setCheckBoxMessage,
  setAiChatBoxMessages,
  setAiGeneratedQuery,
  setAnalyticsData,
  setActiveView,
  setExportData,
  setIsFilterDataLoading
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
