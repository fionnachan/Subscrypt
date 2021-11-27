import { Button, TextInputField } from 'evergreen-ui';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectAddress, selectConnected, selectWalletType, selectConnector, selectFetching, setFetching } from '../../features/walletSlice';
import { getAppGlobalState, StateToObj, subscribePlan } from '../../algorand/contractHelpers';
import { setIsNotificationOpen, setNotificationContent, setNotificationTitle } from '../../features/applicationSlice';
import LoadingIcon from '../LoadingIcon';
import algosdk from 'algosdk';
import { useNavigate } from 'react-router-dom';

const SubscribeView: React.FC = () => {
  const connected = useSelector(selectConnected);
  const loading = useSelector(selectFetching);
  const address = useSelector(selectAddress);
  const walletType = useSelector(selectWalletType);
  const connector = useSelector(selectConnector);
  const [appId, setAppId] = useState("");
  const [months, setMonths] = useState("");
  const [amount, setAmount] = useState(0);
  const [actualPayAmount, setActualPayAmount] = useState(0);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const subscribe = async() => {
    if (!appId || !months) {
      return;
    }
    const _appId = parseInt(appId);
    dispatch(setFetching(true));
    await subscribePlan(
            _appId,
            actualPayAmount,
            address,
            walletType,
            connector
        )
        .then(result => {
          dispatch(setIsNotificationOpen(true));
          dispatch(setNotificationTitle("Subscription Success"));
          dispatch(setNotificationContent("Confirmed at round "+result["confirmed-round"]));
          dispatch(setFetching(false));
          navigate("/supporter/dashboard");
        })
        .catch(error => {
          dispatch(setIsNotificationOpen(true));
          dispatch(setNotificationTitle("Subscription Error"));
          dispatch(setNotificationContent("Please try again."));
          dispatch(setFetching(false));
        });
  }

  useEffect(() => {
    if (appId.length > 0) {
      getAppGlobalState(parseInt(appId))
        .then(result => {
          const _amount = algosdk.microalgosToAlgos(StateToObj(result)["plan_monthly_price"].i);
          setAmount(_amount);
        });
    } else {
      setAmount(0);
    }
  }, [appId]);

  useEffect(() => {
    if (parseInt(months) > 0 && amount > 0) {
      // 0.001 tx fee for opt-in and 0.001 tx fee for payment
      const _actual = parseInt(months) * amount;
      setActualPayAmount(_actual);
    }
  }, [months, amount]);

  return (
    <div className="site-body">
      <div className="site-body-inner form-wrapper">
        <h2>
          Subscribe to Plan
        </h2>
        { loading ? <LoadingIcon/> : 
          connected ? 
          <>
            <TextInputField
              label="App ID"
              description="Enter the app ID for the plan."
              onChange={(event: any) => setAppId(event.target.value)}
              value={appId}
            />
            <TextInputField
              label="Number of Months"
              description="Enter the number of months you'd like to be subscribed for."
              onChange={(event: any) => setMonths(event.target.value)}
              value={months}
            />
            {
              amount ? 
              <div className="form-row">
                <span className="price">Monthly Price: {amount || ""} Algo</span>
              </div>
              : null
            }
            {
              months && amount ?
              <div className="form-row">
                <span className="price">Total: {actualPayAmount} Algo</span>
              </div>
              : null
            }
            <Button appearance="primary" onClick={subscribe}>Subscribe</Button>
          </>
          : <p className="reminder-text">Please connect to your wallet first.</p>
        }
      </div>
    </div>
  );
}

export default SubscribeView;