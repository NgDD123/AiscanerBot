import { combineReducers, configureStore } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage";
import userReducer from "./slice/userSlice"
import persistReducer from "redux-persist/es/persistReducer";
import persistStore from "redux-persist/es/persistStore";


const persistConfig = {
    key: 'root',
    storage: storage,
}
const combinedReducers = combineReducers({
    user: userReducer
})
const persistentReducer = persistReducer(
    persistConfig,
    combinedReducers
)


export const store = configureStore({
    reducer: persistentReducer,
    devTools: process.env.NODE_ENV === "development",
    
})
export const persistor = persistStore(store)