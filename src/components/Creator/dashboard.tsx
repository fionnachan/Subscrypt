import { Button, Table, TextareaField, TextInputField } from 'evergreen-ui';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectAddress, selectConnected, selectWalletType, selectConnector, selectFetching } from '../../features/walletSlice';
import { closeSubscription, convertFromUint8ToInt, createSubscriptionPlan, getUserCreatedPlans, setupSubscription } from '../../algorand/contractHelpers';
import { setIsNotificationOpen, setNotificationContent, setNotificationTitle } from '../../features/applicationSlice';
import LoadingIcon from '../LoadingIcon';
import algosdk from 'algosdk';

const CreatorDashboard: React.FC = () => {
  const connected = useSelector(selectConnected);
  const loading = useSelector(selectFetching);
  const address = useSelector(selectAddress);
  const walletType = useSelector(selectWalletType);
  const connector = useSelector(selectConnector);
  const [plans, setPlans] = useState([]);

  const dispatch = useDispatch();

  const onDeleteError = (error: any) => {
    dispatch(setIsNotificationOpen(true));
    dispatch(setNotificationTitle("Delete Plan Error"))
    dispatch(setNotificationContent("Please try again."))
  }

  const deletePlan = async(appId: string) => {
    if (!address || !walletType || !connector) {
      return;
    }

    await closeSubscription(parseInt(appId), address, walletType, connector)
        .then(result => {
          try {
            console.log("result: ", result)
            dispatch(setIsNotificationOpen(true));
            dispatch(setNotificationTitle("Delete Plan Successfully"))
            dispatch(setNotificationContent("Confirmed at round "+result["confirmed-round"]))
          }
          catch(error) {
            onDeleteError(error);
          }
        })
        .catch(error => {
          onDeleteError(error);
        });
  }

  useEffect(() => {
    if (address.length > 0 && walletType && connector) {
      console.log("address: ",address)
      getUserCreatedPlans(address)
        .then(result => {
          setPlans(result);
        });
    }
  }, [address, walletType, connector]);

  return (
    <>
      <div className="site-body dashboard-view">
        <h2>
          Creator Dashboard
        </h2>
        { loading ? <LoadingIcon/> : 
          connected ? 
          <Table>
            <Table.Head>
              <Table.SearchHeaderCell />
              <Table.TextHeaderCell>Active Subscription Plan ID</Table.TextHeaderCell>
              <Table.TextHeaderCell>Subscribers</Table.TextHeaderCell>
              <Table.TextHeaderCell>Monthly Price</Table.TextHeaderCell>
              <Table.TextHeaderCell>Actions</Table.TextHeaderCell>
            </Table.Head>
            <Table.VirtualBody height={240}>
              {plans.map((plan: any) => (
                <Table.Row key={plan.appId}>
                  <Table.TextCell>{plan.globalState.plan_name}</Table.TextCell>
                  <Table.TextCell>{plan.appId}</Table.TextCell>
                  <Table.TextCell isNumber>{plan.globalState.numOfSubscribers || 0}</Table.TextCell>
                  <Table.TextCell isNumber>{algosdk.microalgosToAlgos(plan.globalState.plan_monthly_price.i)} Algo</Table.TextCell>
                  <Table.TextCell>
                    <Button size="small" onClick={() => deletePlan(plan.appId)}>Delete</Button>
                  </Table.TextCell>
                </Table.Row>
              ))}
            </Table.VirtualBody>
          </Table>
          : <p className="reminder-text">Please connect to your wallet first.</p>
        }
      </div>
    </>
  );
}

export default CreatorDashboard;