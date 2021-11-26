import algosdk from 'algosdk';
import { Button, TextareaField, TextInputField } from 'evergreen-ui';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectAddress, selectConnected, selectWalletType, selectConnector, selectFetching } from '../../features/walletSlice';
import { createSubscriptionPlan, setupSubscription } from '../../algorand/contractHelpers';
import { setIsNotificationOpen, setNotificationContent, setNotificationTitle } from '../../features/applicationSlice';
import LoadingIcon from '../LoadingIcon';

const CreatorHome: React.FC = () => {
  const connected = useSelector(selectConnected);
  const loading = useSelector(selectFetching);
  const address = useSelector(selectAddress);
  const walletType = useSelector(selectWalletType);
  const connector = useSelector(selectConnector);
  const [price, setPrice] = useState(1);

  const dispatch = useDispatch();

  const createPlan = async() => {
      const start: number = Math.floor(new Date().getTime()/1000 + 5*60*1000); // 5 mins from clicking button
      const subscriptionId = await createSubscriptionPlan(price, start, address, walletType, connector);

      await setupSubscription(subscriptionId, address, walletType, connector)
          .then(result => {
            console.log("result: ", result)
            dispatch(setIsNotificationOpen(true));
            dispatch(setNotificationTitle("Subscription Setup Success"))
            dispatch(setNotificationContent("Confirmed at round "+result["confirmed-round"]))
          });
  }

  return (
    <>
      <div className="site-body-inner form-wrapper">
        <h2>
          Create Subscription Plan
        </h2>
        { loading ? <LoadingIcon/> : 
          connected ? 
          <>
            <TextInputField
              label="Creator"
              description="Enter a name for your supporters to identify you."
            />
            <TextInputField
              label="Plan"
              description="Enter your subscription plan name."
            />
            <TextareaField
              label="Description"
              description="Let your supporters know what you are offering them."
            />
            <div className="form-row">
              <TextInputField
                label="Monthly Price"
                description="This is how much your subscribers should pay every month."
                onChange={(event: any) => setPrice(event.target.value)}
                value={price}
              />
              <span>Algo</span>
            </div>
            <Button appearance="primary" onClick={createPlan}>Create Plan</Button>
          </>
          : <p className="reminder-text">Please connect to your wallet first.</p>
        }
      </div>
    </>
  );
}

export default CreatorHome;