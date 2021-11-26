import { Button, TextInputField } from 'evergreen-ui';
import React from 'react';
import { useSelector } from 'react-redux';
import { selectConnected } from '../../features/walletSlice';

const CreatorHome: React.FC = () => {
  const connected = useSelector(selectConnected);

  return (
    <>
      <div className="site-body-inner">
        <h2>
          Create Subscription Plan
        </h2>
        <TextInputField
          label="Name"
          description="Enter your subscription plan name."
        />
        <TextInputField
          label="Description"
          description="Let your supporters know what you are offering them."
        />
        <TextInputField
          label="Monthly Price"
          description="This is how much your subscribers should pay every month."
        />
        <Button appearance="primary">Create Plan</Button>
      </div>
    </>
  );
}

export default CreatorHome;