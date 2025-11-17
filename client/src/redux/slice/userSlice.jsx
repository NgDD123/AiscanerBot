import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isLoggedIn: false,
  user: null,
  accountInfo: null,
  botRunning: false,
  apiKey: null,
  apiSecretKey: null,
  exchangeType: "binanceFutures",
  connected: false,
  accountId: null,
  tradeDecision: null,
  futuresAssets: [],
  tradingPairs: [],
  orderType: "market",
  selectedPair: "KSMUSDT",
  showAccountInfo: false,
  orderTypes: ["market", "limit", "trailing"],
  tradeResult: null,
  tradeResultVisible: false,
  symbol: "",
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    login: (state, { payload }) => {
      state.isLoggedIn = true;
      state.user = { ...payload };
      state.apiKey = "";
      state.apiSecretKey = "";
    },
    logout: (state) => {
      Object.assign(state, initialState); // reset all state to initial values
    },
    connectExchanger: (state, { payload }) => {
      state.connected = true;
      state.accountId = payload?.accountId || null;
    },
    disconnectExchanger: (state) => {
      state.connected = false;
      state.accountId = null;
    },
    startBot: (state) => {
      state.botRunning = true;
    },
    stopBot: (state) => {
      state.botRunning = false;
    },
    fetchAccountInfo: (state, { payload }) => {
      state.accountInfo = payload?.usdtBalance || null;
    },
    handleApiKeyChanges: (state, { payload }) => {
      state.apiKey = payload?.apiKey || "";
      state.apiSecretKey = payload?.apiSecretKey || "";
    },
    clearKeys: (state) => {
      state.connected = false;
      state.accountId = null;
      state.apiKey = "";
      state.apiSecretKey = "";
    },
    setTradeDecision: (state, { payload }) => {
      state.tradeDecision = payload || null;
    },
    greet: (state) => {
      console.log("Current user state:", state);
    },
  },
});

export const {
  greet,
  login,
  logout,
  disconnectExchanger,
  connectExchanger,
  handleApiKeyChanges,
  clearKeys,
  startBot,
  stopBot,
  setTradeDecision,
  fetchAccountInfo,
} = userSlice.actions;

export default userSlice.reducer;
