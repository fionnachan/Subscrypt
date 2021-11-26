import algosdk from 'algosdk';
import { Button, TextareaField, TextInputField } from 'evergreen-ui';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectAddress, selectConnected, selectWalletType, selectConnector } from '../../features/walletSlice';
import { createSubscriptionPlan, setupSubscription } from '../../algorand/contractHelpers';

const CreatorHome: React.FC = () => {
  const connected = useSelector(selectConnected);
  const address = useSelector(selectAddress);
  const walletType = useSelector(selectWalletType);
  const connector = useSelector(selectConnector);
  const [price, setPrice] = useState(0);

  const createPlan = async() => {
    
      const start: number = Math.floor(new Date().getTime()/1000 + 5*60*1000); // 5 mins from clicking button
      const subscriptionId = await createSubscriptionPlan(price, start, address, walletType, connector);

      await setupSubscription(subscriptionId, address, walletType, connector);
  }

  return (
    <>
      <div className="site-body-inner form-wrapper">
        <h2>
          Create Subscription Plan
        </h2>
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
      </div>
    </>
  );
}

export default CreatorHome;