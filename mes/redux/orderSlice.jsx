  // Sipariş operasyonlarının statelerını tutacak slice..
  import { createSlice } from "@reduxjs/toolkit";

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
      groupManagementPopup:true,
      groupListPopup:false,
      groupList:[],
      selectedOrderId:[],
      selectedGroupNo:[],
      filteredGroup:[],
      buzlamaWork:[]
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
      }
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
    setBuzlamaWorks
  } = orderSlice.actions;
  export default orderSlice.reducer;
