import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, IconButton, Menu, MenuIcon, Popover, Position } from 'evergreen-ui';
import { Link } from "react-router-dom";

import { ellipseAddress, formatBigNumWithDecimals } from '../../helpers/utilities';
import { killSession, selectConnector, selectAssets, selectAddress, getAccountAssets, selectChain, setFetching, selectFetching, selectWalletType } from '../../features/walletSlice';
import { setIsModalOpen } from '../../features/applicationSlice';
import { getAlgoAssetData, setAccountsAtConnection, subscribeToEvents } from '../Wallet/utils';
import logo from "../../assets/logo.svg";

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
  }, [address]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    dispatch(setFetching(false));
  }, [assets]); // eslint-disable-line react-hooks/exhaustive-deps
  
  return (
    <div className="site-layout-background site-header">
      <div className="site-header-inner">
        <div className="site-header-left">
          <Link className="site-logo" to="/">
            <img src={logo} alt="Subscrypt"/>
            <span className="site-name">Subscrypt</span>
          </Link>
        </div>
        {!address ?
          <Button
            appearance="primary"
            onClick={() => dispatch(setIsModalOpen(true))}
          >
            Connect Wallet
          </Button>
        : <div className="header-address-info">
            {/* {loading ? null : <span>
              {formatBigNumWithDecimals(nativeCurrency.amount, nativeCurrency.decimals)} {nativeCurrency.unitName || "units"}
            </span>} */}
            <span className="header-account">{ellipseAddress(address)}</span>
            <Popover
              position={Position.BOTTOM_RIGHT}
              content={
                <Menu>
                  <Menu.Group>
                    <Menu.Item onSelect={() => dispatch(killSession())}>
                      Disconnect
                    </Menu.Item>
                  </Menu.Group>
                </Menu>
              }
            >
              <IconButton icon={MenuIcon} marginRight={16} appearance="minimal" className="disconnect-button" />
            </Popover>
        </div>}
      </div>
    </div>
  );
}


export default SiteHeader;