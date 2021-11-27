import { Button, TextareaField, TextInputField } from 'evergreen-ui';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectAddress, selectConnected, selectWalletType, selectConnector, selectFetching, setFetching } from '../../features/walletSlice';
import { createSubscriptionPlan, setupSubscription } from '../../algorand/contractHelpers';
import { setIsNotificationOpen, setNotificationContent, setNotificationTitle } from '../../features/applicationSlice';
import LoadingIcon from '../LoadingIcon';

const CreatorHome: React.FC = () => {
  const connected = useSelector(selectConnected);
  const loading = useSelector(selectFetching);
  const address = useSelector(selectAddress);
  const walletType = useSelector(selectWalletType);
  const connector = useSelector(selectConnector);
  const [creatorName, setCreatorName] = useState("");
  const [planName, setPlanName] = useState("");
  const [planDesc, setPlanDesc] = useState("");
  const [price, setPrice] = useState("");
  const [appId, setAppId] = useState(0);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const createPlan = async() => {
    if (!creatorName || !planName || !planDesc || !price || !address || !walletType || !connector) {
      return;
    }
    dispatch(setFetching(true));
    const _appId = await createSubscriptionPlan(
                                creatorName,
                                planName,
                                planDesc,
                                Number(price),
                                address,
                                walletType,
                                connector);

    await setupSubscription(_appId, address, walletType, connector)
        .then(result => {
          setAppId(_appId);
          dispatch(setIsNotificationOpen(true));
          dispatch(setNotificationTitle("Subscription Setup Success"))
          dispatch(setNotificationContent("Confirmed at round "+result["confirmed-round"]+". Your subscription plan's app ID is "+_appId+"."))
          dispatch(setFetching(false));
          navigate("/creator/dashboard");
        })
        .catch(error => {
          dispatch(setIsNotificationOpen(true));
          dispatch(setNotificationTitle("Subscription Setup Error"))
          dispatch(setNotificationContent(error))
          dispatch(setFetching(false));
        });
  }

  return (
    <div className="site-body">
      <div className="site-body-inner form-wrapper">
        <h2>
          Create Subscription Plan
        </h2>
        { loading ? <LoadingIcon/> : 
          connected ? 
            appId === 0 ?
            <>
              <TextInputField
                label="Creator"
                description="Enter a name for your supporters to identify you."
                onChange={(event: any) => setCreatorName(event.target.value)}
                value={creatorName}
              />
              <TextInputField
                label="Plan"
                description="Enter your subscription plan name."
                onChange={(event: any) => setPlanName(event.target.value)}
                value={planName}
              />
              <TextareaField
                label="Description"
                description="Let your supporters know what you are offering them."
                onChange={(event: any) => setPlanDesc(event.target.value)}
                value={planDesc}
              />
              <div className="form-row">
                <TextInputField
                  label="Monthly Price"
                  description="This is how much subscribers will pay every month."
                  onChange={(event: any) => setPrice(event.target.value)}
                  value={price}
                />
                <span>Algo</span>
              </div>
              <Button appearance="primary" onClick={createPlan}>Create Plan</Button>
            </>
            : <p className="reminder-text">
              Your subscription plan's app ID is {appId}
            </p>
          : <p className="reminder-text">Please connect to your wallet first.</p>
        }
      </div>
    </div>
  );
}

export default CreatorHome;