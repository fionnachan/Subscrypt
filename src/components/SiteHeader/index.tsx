import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Select } from 'evergreen-ui';
import { Accounts } from "@randlabs/myalgo-connect";

import { ellipseAddress, formatBigNumWithDecimals } from '../../helpers/utilities';
import { IAssetData } from '../../helpers/types';
import { setConnected, killSession, selectConnector, selectAssets, selectAddress, getAccountAssets, selectChain, selectConnected, switchChain, setFetching, selectFetching, setWalletType, selectWalletType, setAccounts } from '../../features/walletConnectSlice';
import { setIsModalOpen } from '../../features/applicationSlice';
import { ChainType } from '../../helpers/api';
import { subscribeToEvents } from '../Wallet/utils';

const SiteHeader: React.FC = () => {
  const loading = useSelector(selectFetching);
  const connector = useSelector(selectConnector);
  const connected = useSelector(selectConnected);
  const assets = useSelector(selectAssets);
  const address = useSelector(selectAddress);
  const chain = useSelector(selectChain);
  const walletType = useSelector(selectWalletType);
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

  const dispatch = useDispatch();

  useEffect(() => {
    if (window.localStorage.getItem("walletconnect") != null) {
      dispatch(setWalletType("walletConnect"));
    }
    if (typeof (window as any).AlgoSigner !== 'undefined') {
      dispatch(setWalletType("algoSigner"));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (connected) {
      dispatch(setIsModalOpen(false));
    }
  }, [connected]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Check if connection is already established
    console.log(walletType, "connector", connector)
    if (!connector) {
      return;
    }
    if (walletType === "walletConnect") {
      subscribeToEvents(connector, dispatch);
      if (!connector.connected) {
        connector.createSession();
        dispatch(setConnected(true));
      }
      const { accounts } = connector;
      dispatch(setAccounts(accounts));   
    }
    if (walletType === "myAlgo") {
      connector.connect().then((accounts: Accounts[]) => {
        dispatch(setAccounts(accounts));
        dispatch(setConnected(true));
      });
    }
    if (walletType === "algoSigner") {
      dispatch(setConnected(true));
      connector.accounts({ledger: chain})
        .then((accounts: []) => {
          dispatch(setAccounts(accounts));
        });
    }
  }, [connector]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Check if connection is already established
    if (connector && address && address.length > 0) {
      dispatch(getAccountAssets({chain, address}));
      dispatch(setFetching(true));
    }
  }, [address, chain]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    dispatch(setFetching(false));
  }, [assets]); // eslint-disable-line react-hooks/exhaustive-deps
  
  return (
    <div className="site-layout-background site-header">
      <div className="site-header-inner">
        <div>
          <span>Connected to </span>
          <Select
            defaultValue={ChainType.TestNet}
            onChange={event => dispatch(switchChain((event.target as HTMLSelectElement).value))}
            >
            <option value={ChainType.TestNet}>
              Testnet
            </option>
            <option value={ChainType.MainNet}>
              Mainnet
            </option>
          </Select>
        </div>
        {!address ?
          <Button onClick={() => dispatch(setIsModalOpen(true))}>
            {"Connect Wallet"}
          </Button>
        : <div className="header-address-info">
            {loading ? null : <span>
              {formatBigNumWithDecimals(nativeCurrency.amount, nativeCurrency.decimals)} {nativeCurrency.unitName || "units"}
            </span>}
            <span className="header-account">{ellipseAddress(address)}</span>
            <Button
              className="disconnect-button"
              onClick={() => dispatch(killSession())}
            >
              {"Disconnect"}
            </Button>
        </div>}
      </div>
    </div>
  );
}


export default SiteHeader;