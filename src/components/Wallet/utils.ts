import WalletConnect from '@walletconnect/client';
import { Dispatch } from 'react';
import { reset, setAccounts, setConnected } from '../../features/walletSlice';
import { IAssetData } from '../../helpers/types';

export const subscribeToEvents = (dispatch: Dispatch<any>) => (connector: WalletConnect) => {
  if (!connector) {
    return;
  }
  // Subscribe to connection events
  connector.on("connect", (error, payload) => {
    console.log("%cOn connect", "background: yellow");
    if (error) {
      throw error;
    }
    const { accounts } = payload.params[0];
    dispatch(setAccounts(accounts));
  });
  
  connector.on("session_update", (error, payload) => {
    console.log("%cOn session_update", "background: yellow");
    if (error) {
      throw error;
    }
    const { accounts } = payload.params[0];
    dispatch(setAccounts(accounts));
  });
  
  connector.on("disconnect", (error, payload) => {
    console.log("%cOn disconnect", "background: yellow");
    if (error) {
      throw error;
    }
    dispatch(reset());
  });
}

export const setAccountsAtConnection = (dispatch: Dispatch<any>) => (accounts: []) => {
  dispatch(setAccounts(accounts));
  dispatch(setConnected(true));
}

export const getAlgoAssetData = (assets: IAssetData[]) => {
  let nativeCurrency = assets && assets.find((asset: IAssetData) => asset && asset.id === 0);
  if (nativeCurrency === undefined || nativeCurrency == null) {
    nativeCurrency = {
      id: 0,
      amount: BigInt(0),
      creator: "",
      frozen: false,
      decimals: 6,
      name: "Algo",
      unitName: "Algo",
    };
  }
  return nativeCurrency;
}