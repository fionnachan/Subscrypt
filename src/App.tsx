import React, { useEffect } from 'react';
import { Button, Dialog } from 'evergreen-ui';
import { useDispatch, useSelector } from 'react-redux';

import './App.css';
import SiteHeader from './components/SiteHeader';
import { selectWalletType, setWalletType, walletInit } from './features/walletConnectSlice';
import { selectIsModalOpen, setIsModalOpen } from './features/applicationSlice';
import SiteBody from './components/SiteBody';
import algowallet from "./assets/algorandwallet.svg";
import myalgo from "./assets/myalgo.svg";
import algosigner from "./assets/algosigner.svg";

const App: React.FC = () => {
  const isModalOpen = useSelector(selectIsModalOpen);
  const walletType = useSelector(selectWalletType);
  const dispatch = useDispatch();
  const setWalletAndConnect = (walletName: string) =>
      dispatch(setWalletType(walletName));

  useEffect(() => {
    if (walletType.length > 0) {
      dispatch(walletInit());
    }
  }, [walletType]);

  return (
    <div>
      <div className="site-layout">
        <SiteHeader/>
        <SiteBody/>
        <div className="footer">Subscrypt ©2021 Created with 💖</div>
        <Dialog
          isShown={isModalOpen}
          title="Connect to a wallet"
          hasFooter={false}
          onCloseComplete={() => dispatch(setIsModalOpen(false))}
        >
          <Button className="wallet-button" onClick={() => dispatch(setWalletAndConnect("walletConnect"))}>
            <img className="wallet-icon" src={algowallet} alt="Algorand wallet"/>
            <span>Algorand Wallet</span>
          </Button>
          <Button className="wallet-button" onClick={() => dispatch(setWalletAndConnect("myAlgo"))}>
            <img className="wallet-icon" src={myalgo} alt="MyAlgo Wallet" />
            <span>My Algo Wallet</span>
          </Button>
          <Button className="wallet-button" onClick={() => dispatch(setWalletAndConnect("algoSigner"))}>
            <img className="wallet-icon" src={algosigner} alt="AlgoSigner" />
            <span>AlgoSigner</span>
          </Button>
        </Dialog>
      </div>
    </div>
  );
}

export default App;
