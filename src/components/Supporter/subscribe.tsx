import { Button, TextareaField, TextInputField } from 'evergreen-ui';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectAddress, selectConnected, selectWalletType, selectConnector, selectFetching } from '../../features/walletSlice';
import { subscribePlan } from '../../algorand/contractHelpers';
import { setIsNotificationOpen, setNotificationContent, setNotificationTitle } from '../../features/applicationSlice';
import LoadingIcon from '../LoadingIcon';

const SubscribeView: React.FC = () => {
  const connected = useSelector(selectConnected);
  const loading = useSelector(selectFetching);
  const address = useSelector(selectAddress);
  const walletType = useSelector(selectWalletType);
  const connector = useSelector(selectConnector);
  const [appId, setAppId] = useState("");
  const [months, setMonths] = useState("");
  const [amount, setAmount] = useState(0);

  const dispatch = useDispatch();

  const subscribe = async() => {
    if (!appId || !months) {
      return;
    }
    await subscribePlan(
            parseInt(appId),
            amount,
            parseInt(months),
            address,
            walletType,
            connector
        )
        .then(result => {
          console.log("result: ", result)
          dispatch(setIsNotificationOpen(true));
          dispatch(setNotificationTitle("Subscription Success"))
          dispatch(setNotificationContent("Confirmed at round "+result["confirmed-round"]))
        })
        .catch(error => {
          dispatch(setIsNotificationOpen(true));
          dispatch(setNotificationTitle("Subscription Error"))
          dispatch(setNotificationContent(error))
        });
  }

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
            <Button appearance="primary" onClick={subscribe}>Subscribe</Button>
          </>
          : <p className="reminder-text">Please connect to your wallet first.</p>
        }
      </div>
    </div>
  );
}

export default SubscribeView;