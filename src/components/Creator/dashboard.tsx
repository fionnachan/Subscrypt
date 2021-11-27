import { Button, TextareaField, TextInputField } from 'evergreen-ui';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectAddress, selectConnected, selectWalletType, selectConnector, selectFetching } from '../../features/walletSlice';
import { closeSubscription, createSubscriptionPlan, readGlobalState, setupSubscription } from '../../algorand/contractHelpers';
import { setIsNotificationOpen, setNotificationContent, setNotificationTitle } from '../../features/applicationSlice';
import LoadingIcon from '../LoadingIcon';

const CreatorDashboard: React.FC = () => {
  const connected = useSelector(selectConnected);
  const loading = useSelector(selectFetching);
  const address = useSelector(selectAddress);
  const walletType = useSelector(selectWalletType);
  const connector = useSelector(selectConnector);
  const [creatorName, setCreatorName] = useState("");
  const [planName, setPlanName] = useState("");
  const [planDesc, setPlanDesc] = useState("");
  const [price, setPrice] = useState("");
  const [wtf, setWtf] = useState("");

  const dispatch = useDispatch();

  const createPlan = async() => {
    if (!creatorName || !planName || !planDesc || !price) {
      return;
    }
    const subscriptionId = await createSubscriptionPlan(
                                creatorName,
                                planName,
                                planDesc,
                                parseInt(price),
                                address,
                                walletType,
                                connector);

    await setupSubscription(subscriptionId, address, walletType, connector)
        .then(result => {
          console.log("result: ", result)
          dispatch(setIsNotificationOpen(true));
          dispatch(setNotificationTitle("Subscription Setup Success"))
          dispatch(setNotificationContent("Confirmed at round "+result["confirmed-round"]))
        })
        .catch(error => {
          dispatch(setIsNotificationOpen(true));
          dispatch(setNotificationTitle("Subscription Setup Error"))
          dispatch(setNotificationContent(error))
        });
  }

  useEffect(() => {
      return;
    if (address.length > 0 && walletType && connector) {
      console.log("address: ",address)
      closeSubscription(47709978, address, walletType, connector);
    }
    // setWtf(_wtf);
  }, [address, walletType, connector]);

  return (
    <>
      <div className="site-body dashboard-view">
        <h2>
          Creator Dashboard
        </h2>
        { loading ? <LoadingIcon/> : 
          connected ? 
          <>
            <Button appearance="primary" onClick={createPlan}>Create Plan</Button>
          </>
          : <p className="reminder-text">Please connect to your wallet first.</p>
        }
      </div>
    </>
  );
}

export default CreatorDashboard;