import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Select } from 'evergreen-ui';

import { ellipseAddress, formatBigNumWithDecimals } from '../../helpers/utilities';
import { killSession, selectConnector, selectAssets, selectAddress, getAccountAssets, selectChain, selectConnected, switchChain, setFetching, selectFetching, setWalletType, selectWalletType, setAccounts } from '../../features/walletSlice';
import { setIsModalOpen } from '../../features/applicationSlice';
import { ChainType } from '../../helpers/api';
import { getAlgoAssetData, setAccountsAtConnection, subscribeToEvents } from '../Wallet/utils';

const SiteHeader: React.FC = () => {
  const loading = useSelector(selectFetching);
  const connector = useSelector(selectConnector);
  const assets = useSelector(selectAssets);
  const address = useSelector(selectAddress);
  const chain = useSelector(selectChain);
  const walletType = useSelector(selectWalletType);
  const nativeCurrency = getAlgoAssetData(assets);

  const dispatch = useDispatch();

  useEffect(() => {
    // Check if connection is already established
    if (!connector) {
      return;
    }
    if (walletType === "walletConnect") {
      subscribeToEvents(dispatch)(connector);
      if (!connector.connected) {
        connector.createSession();
      }
      const { accounts } = connector;
      setAccountsAtConnection(dispatch)(accounts);
    }
    if (walletType === "myAlgo") {
      connector.connect().then((accounts: []) => {
        setAccountsAtConnection(dispatch)(accounts);
      });
    }
    if (walletType === "algoSigner") {
      connector.accounts({ledger: chain})
        .then((accounts: []) => {
          setAccountsAtConnection(dispatch)(accounts);
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