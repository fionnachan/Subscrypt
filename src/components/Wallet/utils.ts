import WalletConnect from '@walletconnect/client';
import { Dispatch } from 'react';
import { reset, setAccounts } from '../../features/walletConnectSlice';

export const subscribeToEvents = (connector: WalletConnect, dispatch: Dispatch<any>) => {
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