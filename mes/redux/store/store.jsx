// store/store.js
import { configureStore } from "@reduxjs/toolkit";
import globalReducer from "../globalSlice"
import userReducer from "../userSlice";
import breakReducer from "../breakOperationsSlice"
const store = configureStore({
  reducer: {
    user: userReducer,
    global:globalReducer,
    break:breakReducer,
  },
});

export default store;
