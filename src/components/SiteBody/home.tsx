import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectConnected, selectFetching } from '../../features/walletSlice';
import LoadingIcon from '../LoadingIcon';

const Home: React.FC = () => {
  const connected = useSelector(selectConnected);
  const loading = useSelector(selectFetching);

  return (
    <div className="site-body">
      <h1>Welcome to Subscrypt</h1>
      <p className="desc">
        We are a decentralised subscription service for creators and their supporters.
      </p>
      { loading ? <LoadingIcon/> : 
        connected ? 
          <div className="site-body-inner">
            <h2>
              Choose Your Role
            </h2>
            <Link className="role-button" to="/creator">
              I am a Creator
            </Link>
            <Link className="role-button" to="/supporter">
              I am a Supporter
            </Link>
        </div>
        : <div>
            <p className="desc">
              Creators can customise their plans on Subscrypt. Supporters can use their Algorand wallet to pay for the subscription and our smart contracts will handle the rest.
            </p>
            <p className="desc">
              A decentralised subscription service offers creators freedom on how and where their paywalled content will be hosted. Creators can integrate their supporters' Subscrypt status to their own platform for providing perks.
            </p>
            <p className="desc">
              Connect your wallet to try now!
            </p>
          </div>
      }
    </div>
  )
}

export default Home;