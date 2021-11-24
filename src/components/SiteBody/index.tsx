import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectAssets, selectConnected, selectFetching } from '../../features/walletSlice';
import AccountAssets from '../AccountAssets';
import LoadingIcon from '../LoadingIcon';

const SiteBody: React.FC = () => {
  const connected = useSelector(selectConnected);
  const assets = useSelector(selectAssets);
  const loading = useSelector(selectFetching);

  return (
    <div className="site-body">
      <h1>Welcome to Subscrypt</h1>
      <p className="desc">
        We are a decentralised subscription service for creators and their supporters.
      </p>
      { loading ? <LoadingIcon/> : null }
      {
        !loading && connected ? 
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
        : null
      }
    </div>
  )
}

export default SiteBody;