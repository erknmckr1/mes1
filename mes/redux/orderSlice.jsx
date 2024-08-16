  // Sipariş operasyonlarının statelerını tutacak slice..
  import { createSlice,createAsyncThunk } from "@reduxjs/toolkit";
  import axios from "axios";

  export const handleGetGroupList = createAsyncThunk(
    "order/fetchGroupList",  // Unik bir isim olmasına dikkat edin
    async (_, thunkAPI) => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/getGroupList`);
        return response.data;
      } catch (err) {
        return thunkAPI.rejectWithValue(err.response.data);
      }
    }
  );

  export const fetchBuzlamaWorks = createAsyncThunk(
    "order/fetchWorksList",
    async (params, thunkAPI) => {
      const {areaName} = params;
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/getWorkToBuzlama`,{
          params:{
            areaName
          }
        });
        return response.data;
      } catch (err) {
        return thunkAPI.rejectWithValue(err.response.data);
      }
    }
  );

  const orderSlice = createSlice({
    name: "order",
    initialState: {
      selectedOrder: null, // seçili siparişi tutacak state...
      workList:[], // Mevcut işleri tutacak state
      stopReasonPopup: null, // sipariş durdurma popup ın durumunu tutan state
      cancelReasonPopup: null, // sipariş iptal popupının durumunu tutan state
      repairJobPopup: null, // sipariş tamir popupının durumunu tutan state
      read_order: null, // okutulan sıparısında tasını tutacak state
      selectedProcess: "default", // sipariş baslatmadan once secılecek process ı tutan state
      selectedMachine: "default", // sipariş baslatmadan once secılecek makıneyı tutan state
      processList: null,
      machineList: null,
      finishedAmount:"", // Siparişin sağlıklı bitirilecek kısmını tutacak state gr ...
      finishedKalitePopup:null, // Kalitenin bitirme popup ının durumunu tutan state 
      finishedWorkPopup:null, // Bitirme popupının durumunu tutan state...
      // buzlamaaaaa...
      groupManagementPopup:false,
      groupListPopup:false,
      groupList:[],
      selectedOrderId:[],
      selectedGroupNo:[],
      filteredGroup:[],
      buzlamaWork:[],
      sendToMachinePopup:false, // makineye göndermek ıcın ılgılı popup ın durumunu tutan state...
      // Ölçüm veri girişi 
      measurementEntryPopup:true,
    },
    reducers: {
      setSelectedOrder: (state, action) => {
        state.selectedOrder = action.payload;
      },
      setWorkList:(state,action) => {
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
      setFinishedAmount:(state,action) => {
        state.finishedAmount = action.payload;
      },
      setFinishedWorkPopup:(state,action) => {
        state.finishedWorkPopup = action.payload;
      },
      setFinishedPopupKalite:(state,action)=>{
        state.finishedKalitePopup = action.payload;
      },
      setOrderGroupManagement: (state, action) => {
        state.groupManagementPopup = action.payload;
      },
      setGroupListPopup:(state,action) => {
        state.groupListPopup = action.payload;
      },
      setGetGroupList:(state,action) => {
        state.groupList = action.payload;
      },
      setSelectedOrderIds:(state, action) => {
        state.selectedOrderId = action.payload;
      },      
      setSelectedGroupNos:(state,action) => {
        state.selectedGroupNo = action.payload;
      },
      setFilteredGroup:(state,action) => {
        state.filteredGroup = action.payload;
      },
      setBuzlamaWorks:(state,action) => {
        state.buzlamaWork = action.payload;
      },
      setSendToMachinePopup:(state,action) => {
        state.sendToMachinePopup = action.payload;
      },
      setMeasurementPopup:(state,action) => {
        state.measurementEntryPopup = action.payload;
      }
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
          console.error('Failed to fetch group list:', action.payload);
        })
  
        // fetchBuzlamaWorks işlemleri
        .addCase(fetchBuzlamaWorks.pending, (state) => {
          state.buzlamaWork = [];
        })
        .addCase(fetchBuzlamaWorks.fulfilled, (state, action) => {
          state.buzlamaWork = action.payload;
        })
        .addCase(fetchBuzlamaWorks.rejected, (state, action) => {
          console.error('Failed to fetch buzlama works:', action.payload);
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
    // buzlama vs ekranlar...
    setOrderGroupManagement,
    setGroupListPopup,
    setGetGroupList,
    setSelectedOrderIds,
    setSelectedGroupNos,
    setFilteredGroup,
    setBuzlamaWorks,
    setSendToMachinePopup,
    // ölçüm veri girişi
    setMeasurementPopup
  } = orderSlice.actions;
  export default orderSlice.reducer;
