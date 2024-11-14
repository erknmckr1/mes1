// store/store.js
import { configureStore } from "@reduxjs/toolkit";
import globalReducer from "../globalSlice";
import userReducer from "../userSlice";
import breakReducer from "../breakOperationsSlice";
import orderReducer from "../orderSlice";
import workFlowManagementReducer from "../workFlowManagement";
import shiftReducer from "../shiftSlice";
const store = configureStore({
  reducer: {
    user: userReducer,
    global: globalReducer,
    break: breakReducer,
    order: orderReducer,
    flowmanagement: workFlowManagementReducer,
    shift: shiftReducer,
  },
});

export default store;
