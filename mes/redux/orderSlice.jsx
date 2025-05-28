import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

//! İlgili bölümdeki kullanıcıları çekecek async thunk...
export const getJoinTheField = createAsyncThunk(
  "order/fetchJoinTheField",
  async (params, thunkAPI) => {
    const { areaName } = params;
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/getPersonInTheField`,
        {
          params: {
            areaName,
          },
        }
      );
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response.data);
    }
  }
);
//! Grup listesini çekecek async thunk
export const handleGetGroupList = createAsyncThunk(
  "order/fetchGroupList",
  async (_, thunkAPI) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/getGroupList`
      );
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response.data);
    }
  }
);

//! Buzlama işleri listeleyecek async thunk
export const fetchBuzlamaWorks = createAsyncThunk(
  "order/fetchWorksList",
  async (params, thunkAPI) => {
    const { areaName } = params;
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/getWorkToBuzlama`,
        {
          params: {
            areaName,
          },
        }
      );
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response.data);
    }
  }
);

//! getWorksWithoutId işlemi için async thunk
export const getWorksWithoutId = createAsyncThunk(
  "order/getWorksWithoutId",
  async (params, thunkAPI) => {
    const { areaName } = params;
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/getWorksWithoutId`,
        {
          params: {
            areaName,
          },
        }
      );
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response.data);
    }
  }
);

// Sipariş operasyonlarını tutacak slice
const orderSlice = createSlice({
  name: "order",
  initialState: {
    selectedOrder: [],
    workList: [],
    stopReasonPopup: null,
    cancelReasonPopup: null,
    repairJobPopup: null,
    read_order: null,
    selectedProcess: "",
    selectedMachine: "",
    processList: null,
    machineList: null,
    finishedAmount: "",
    finishedKalitePopup: null,
    finishedWorkPopup: null,
    groupManagementPopup: false,
    groupListPopup: false,
    groupList: [],
    selectedOrderId: [],
    selectedGroupNo: [],
    filteredGroup: [],
    buzlamaWork: [],
    sendToMachinePopup: false,
    actionType: "",
    conditionalFinishPopup: false,
    pastGroupOperationsPopup: false,
    measurementEntryPopup: false,
    selectedHammerSectionField: "", // Cekic ekranındaki alan ismini tutacak state...
    usersJoinedTheField: [], // Alana katılan kullanıcıların tutulacagı state
    selectedPersonInField:"", // alana katılmıs secılmıs kullanıyı tutacak state...
    workHistoryData: [], // İş geçmişi verilerini tutacak state
  },
  reducers: {
    setSelectedOrder: (state, action) => {
      state.selectedOrder = action.payload;
    },
    setWorkList: (state, action) => {
      state.workList = action.payload;
    },
    setStopReasonPopup: (state, action) => {
      state.stopReasonPopup = action.payload;
    },
    setCancelReasonPopup: (state, action) => {
      state.cancelReasonPopup = action.payload;
    },
    setRepairJobPopup: (state, action) => {
      state.repairJobPopup = action.payload;
    },
    setReadOrder: (state, action) => {
      state.read_order = action.payload;
    },
    setSelectedProcess: (state, action) => {
      state.selectedProcess = action.payload;
    },
    setSelectedMachine: (state, action) => {
      state.selectedMachine = action.payload;
    },
    setProcessList: (state, action) => {
      state.processList = action.payload;
    },
    setMachineList: (state, action) => {
      state.machineList = action.payload;
    },
    setFinishedAmount: (state, action) => {
      state.finishedAmount = action.payload;
    },
    setFinishedWorkPopup: (state, action) => {
      state.finishedWorkPopup = action.payload;
    },
    setFinishedPopupKalite: (state, action) => {
      state.finishedKalitePopup = action.payload;
    },
    setOrderGroupManagement: (state, action) => {
      state.groupManagementPopup = action.payload;
    },
    setGroupListPopup: (state, action) => {
      state.groupListPopup = action.payload;
    },
    setGetGroupList: (state, action) => {
      state.groupList = action.payload;
    },
    setSelectedOrderIds: (state, action) => {
      state.selectedOrderId = action.payload;
    },
    setSelectedGroupNos: (state, action) => {
      state.selectedGroupNo = action.payload;
    },
    setFilteredGroup: (state, action) => {
      state.filteredGroup = action.payload;
    },
    setBuzlamaWorks: (state, action) => {
      state.buzlamaWork = action.payload;
    },
    setSendToMachinePopup: (state, action) => {
      state.sendToMachinePopup = action.payload.visible;
      state.actionType = action.payload.actionType || "";
    },
    setMeasurementPopup: (state, action) => {
      state.measurementEntryPopup = action.payload;
    },
    setConditionalFinishPopup: (state, action) => {
      state.conditionalFinishPopup = action.payload;
    },
    setPastGroupOperationsPopup: (state, action) => {
      state.pastGroupOperationsPopup = action.payload;
    },
    setSelectedHammerSectionField: (state, action) => {
      state.selectedHammerSectionField = action.payload;
    },
    setSelectedPersonInField:(state,action) => {
      state.selectedPersonInField = action.payload
    },
    setWorkHistoryData: (state, action) => {
      state.workHistoryData = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // handleGetGroupList işlemleri
      .addCase(handleGetGroupList.pending, (state) => {
        state.groupList = [];
      })
      .addCase(handleGetGroupList.fulfilled, (state, action) => {
        state.groupList = action.payload;
      })
      .addCase(handleGetGroupList.rejected, (state, action) => {
        console.error("Failed to fetch group list:", action.payload);
      })

      // fetchBuzlamaWorks işlemleri
      .addCase(fetchBuzlamaWorks.pending, (state) => {
        state.buzlamaWork = [];
      })
      .addCase(fetchBuzlamaWorks.fulfilled, (state, action) => {
        state.buzlamaWork = action.payload;
      })
      .addCase(fetchBuzlamaWorks.rejected, (state, action) => {
        console.error("Failed to fetch buzlama works:", action.payload);
      })

      // getWorksWithoutId işlemleri operasyonn oncesı ıd gırılen ekranlar ıcın bu fonksıyonu kullanıyoruz.
      .addCase(getWorksWithoutId.pending, (state) => {
        state.workList = [];
      })
      .addCase(getWorksWithoutId.fulfilled, (state, action) => {
        state.workList = action.payload;
      })
      .addCase(getWorksWithoutId.rejected, (state, action) => {
        console.error("Failed to fetch works without ID:", action.payload);
      })
      // İlgili alan da bölüme katılmıs ullanıcılara cekecek thunk fonksıyonları
      .addCase(getJoinTheField.pending, (state) => {
        state.usersJoinedTheField = [];
      })
      .addCase(getJoinTheField.fulfilled, (state, action) => {
        state.usersJoinedTheField = action.payload;
      })
      .addCase(getJoinTheField.rejected, (state, action) => {
        console.error("Failed to fetch works without ID:", action.payload);
      });
  },
});

export const {
  setProcessList,
  setReadOrder,
  setSelectedOrder,
  setStopReasonPopup,
  setCancelReasonPopup,
  setRepairJobPopup,
  setSelectedMachine,
  setSelectedProcess,
  setMachineList,
  setFinishedAmount,
  setWorkList,
  setFinishedWorkPopup,
  setOrderGroupManagement,
  setGroupListPopup,
  setGetGroupList,
  setSelectedOrderIds,
  setSelectedGroupNos,
  setFilteredGroup,
  setBuzlamaWorks,
  setSendToMachinePopup,
  setPastGroupOperationsPopup,
  setMeasurementPopup,
  setConditionalFinishPopup,
  setSelectedHammerSectionField,
  setSelectedPersonInField,
  setWorkHistoryData
} = orderSlice.actions;

export default orderSlice.reducer;
