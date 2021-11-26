import React, { useEffect } from 'react';
import {
  Routes,
  Route,
  Link
} from "react-router-dom";
import { Button, Dialog } from 'evergreen-ui';
import { useDispatch, useSelector } from 'react-redux';

import './App.css';
import SiteHeader from './components/SiteHeader';
import { selectConnected, selectWalletType, setWalletType, walletInit } from './features/walletSlice';
import { selectIsModalOpen, setIsModalOpen } from './features/applicationSlice';
import Home from './components/SiteBody/home';
import algowallet from "./assets/algorandwallet.svg";
import myalgo from "./assets/myalgo.svg";
import algosigner from "./assets/algosigner.svg";
import CreatorHome from './components/Creator/home';

const App: React.FC = () => {
  const isModalOpen = useSelector(selectIsModalOpen);
  const walletType = useSelector(selectWalletType);
  const connected = useSelector(selectConnected);
  const dispatch = useDispatch();
  const setWalletAndConnect = (walletName: string) =>
      dispatch(setWalletType(walletName));

  useEffect(() => {
    // auto-detect is user has connected their wallet to the app
    if (window.localStorage.getItem("walletconnect") != null) {
      dispatch(setWalletType("walletConnect"));
    } else if (typeof (window as any).AlgoSigner !== 'undefined') {
      dispatch(setWalletType("algoSigner"));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (walletType.length > 0) {
      dispatch(walletInit());
    }
  }, [walletType]);

  useEffect(() => {
    if (connected) {
      dispatch(setIsModalOpen(false));
    }
  }, [connected]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="site-layout">
      <SiteHeader/>
      <div className="site-body">
        <Routes>
          <Route index element={<Home/>} />
          <Route path="creator" element={<CreatorHome/>}/>
        </Routes>
      </div>
      <div className="footer">Subscrypt ©2021 Created with 💖</div>
      <Dialog
        isShown={isModalOpen}
        title="Connect to a wallet"
        hasFooter={false}
        onCloseComplete={() => dispatch(setIsModalOpen(false))}
      >
        <Button className="wallet-button" appearance="minimal" onClick={() => dispatch(setWalletAndConnect("walletConnect"))}>
          <img className="wallet-icon" src={algowallet} alt="Algorand wallet"/>
          <span>Algorand Wallet</span>
        </Button>
        <Button className="wallet-button" appearance="minimal" onClick={() => dispatch(setWalletAndConnect("myAlgo"))}>
          <img className="wallet-icon" src={myalgo} alt="MyAlgo Wallet" />
          <span>My Algo Wallet</span>
        </Button>
        <Button className="wallet-button" appearance="minimal" onClick={() => dispatch(setWalletAndConnect("algoSigner"))}>
          <img className="wallet-icon" src={algosigner} alt="AlgoSigner" />
          <span>AlgoSigner</span>
        </Button>
      </Dialog>
    </div>
  );
}

export default App;
