import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import WalletConnect from "@walletconnect/client";
import QRCodeModal from "algorand-walletconnect-qrcode-modal";
import MyAlgo from "@randlabs/myalgo-connect";
import { apiGetAccountAssets, ChainType } from "../helpers/api";
import { IAssetData } from "../helpers/types";

interface WalletState {
  chain: ChainType,
  walletType: string,
  accounts: string[],
  address: string,
  assets: IAssetData[],
  connected: boolean,
  connector: any,
  fetching: boolean,
}

const initialState = {
  chain: ChainType.TestNet,
  walletType: "",
  accounts: [],
  address: "",
  assets: [],
  connected: false,
  connector: null,
  fetching: false,
} as WalletState;

const getWalletConnect = () => new WalletConnect({
  bridge: "https://bridge.walletconnect.org",
  qrcodeModal: QRCodeModal,
});

const getMyAlgo = () => new MyAlgo();

const getAlgoSigner = () => (window as any).AlgoSigner;

export const getAccountAssets = createAsyncThunk("walletConnect/getAccountAssets", async (accountData: {chain: ChainType, address: string}) => {
  const { chain, address } = accountData;
  const response = apiGetAccountAssets(chain, address)
  return response;
})

export const walletSlice = createSlice({
    name: 'wallet',
    initialState,
    reducers: {
      setFetching(state, action) {
        console.log("setFetching: ", action.payload)
        state.fetching = action.payload;
      },
      setWalletType(state, action) {
        state.walletType = action.payload;
      },
      switchChain(state, action) {
        console.log("switchChain chain: ", action.payload)
        state.chain = action.payload;
      },
      reset: state => {
        state.accounts = [];
        state.address = "";
        state.assets = [];
        state.connected = false;
        state.connector = null;
        state.walletType = "";
        console.log("reset state", state)
      },
      walletInit: state => {
        // Create a connector
        if (state.walletType === "walletConnect") {
          state.connector = getWalletConnect();
        } else if (state.walletType === "myAlgo") {
          state.connector = getMyAlgo();
        } else if (state.walletType === "algoSigner") {
          state.connector = getAlgoSigner();
        }
      },
      setConnected: (state, action) => {
        state.connected = action.payload;
      },
      setAccounts: (state, action) => {
        state.accounts = action.payload;
        if (state.walletType === "walletConnect") {
          state.address = action.payload[0];
        } else if (state.walletType === "myAlgo" || state.walletType === "algoSigner") {
          state.address = action.payload[0].address;
        }
      },
      setAccountAssets: (state, action) => {
        state.assets = action.payload;
      },
      killSession: state => {
        if (state.connected) {
          if (state.walletType === "walletConnect") {
            (state.connector as WalletConnect).killSession();
          } else if (state.walletType === "myAlgo" || state.walletType === "algoSigner") {
            walletSlice.caseReducers.reset(state);
          }
        }
      }
    },
    extraReducers(builder) {
      builder.addCase(getAccountAssets.fulfilled, (state, action) => {
        state.assets = action.payload;
      })
    }
});

export const selectWalletType = (state: any) => state.wallet && state.wallet.walletType;
export const selectFetching = (state: any) => state.wallet && state.wallet.fetching;
export const selectChain = (state: any) => state.wallet && state.wallet.chain;
export const selectConnected = (state: any) => state.wallet && state.wallet.connected;
export const selectConnector = (state: any) => state.wallet && state.wallet.connector;
export const selectAssets = (state: any) => state.wallet && state.wallet.assets;
export const selectAddress = (state: any) => state.wallet && state.wallet.address;

export const {
  setFetching,
  switchChain,
  reset,
  setWalletType,
  walletInit,
  setConnected,
  setAccounts,
  killSession
} = walletSlice.actions;

export default walletSlice.reducer;