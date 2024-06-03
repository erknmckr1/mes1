// store/store.js
import { configureStore } from "@reduxjs/toolkit";
import globalReducer from "../globalSlice";
import userReducer from "../userSlice";
import breakReducer from "../breakOperationsSlice";
import orderReducer from "../orderSlice";
const store = configureStore({
  reducer: {
    user: userReducer,
    global:globalReducer,
    break:breakReducer,
    order:orderReducer,
  },
});

export default store;
