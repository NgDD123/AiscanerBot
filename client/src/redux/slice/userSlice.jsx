import { createSlice } from "@reduxjs/toolkit";
const initialState = {
    isLoggedIn: false,
    user: null,
    accountInfo: null,
    botRunning: false,
    apiKey: null,
    apiSecretKey: null,
    exchangeType: 'binanceFutures',
    connected: false,
    accountId: null,
    tradeDecision: null,
    futuresAssets: [],
    tradingPairs: [],
    orderType: 'market',
    selectedPair: 'KSMUSDT',
    showAccountInfo: false,
    orderTypes: ['market', 'limit', 'trailing'],
    tradeResult: null,
    tradeResultVisible: false,
    symbol: '',
}

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        login: (state, { payload }) => {
            state.isLoggedIn = true;
            state.user = { ...payload };
            state.apiKey = "";
            state.apiSecretKey = "";




        },
        logout: (state) => {
            state.isLoggedIn = false;
            state.user = null;
            state.apiKey = null;
            state.apiSecretKey = null;
            state.accountId = null;
            state.connected = false;
            state.botRunning = false;

        },
        connectExchanger: (state, { payload }) => {
            state.connected = true;
            state.accountId = payload.accountId;

        }
        ,
        startBot:(state)=>{
            state.botRunning = true;
        },
        stopBot:(state)=>{
            state.botRunning = false;
        }
        ,
        disconnectExchanger: (state) => {
            state.connected = false;
            state.accountId = null;
        }
        ,
        fetchAccountInfo: (state, { payload }) => {
            state.accountInfo = payload.usdtBalance;
        },
        handleApiKeyChanges: (state, { payload }) => {
            state.apiKey = payload.apiKey;
            state.apiSecretKey = payload.apiSecretKey;
        }
        ,
        greet: (state) => {
            console.log("here is the initial state", state)
        },
        clearKeys:(state)=>{
            state.connected = false;
            state.accountId = null;
            state.apiKey = '';
            state.apiSecretKey = '';
        }
    }
})
export const { greet, login, logout, disconnectExchanger, connectExchanger, handleApiKeyChanges,clearKeys,startBot,stopBot } = userSlice.actions;
export default userSlice.reducer;