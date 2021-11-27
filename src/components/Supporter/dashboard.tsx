import { Button, Table } from 'evergreen-ui';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectAddress, selectConnected, selectWalletType, selectConnector, selectFetching } from '../../features/walletSlice';
import { getSubscriptionPlan, getUserSubscribedPlans } from '../../algorand/contractHelpers';
import LoadingIcon from '../LoadingIcon';
import algosdk from 'algosdk';
import { Subscription } from '../../algorand/subscription';

const SupporterDashboard: React.FC = () => {
  const connected = useSelector(selectConnected);
  const loading = useSelector(selectFetching);
  const address = useSelector(selectAddress);
  const walletType = useSelector(selectWalletType);
  const connector = useSelector(selectConnector);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    if (!address || !walletType || !connector) {
      return;
    }
  }, [address, walletType, connector]);

  useEffect(() => {
    if (address.length > 0) {
      getUserSubscribedPlans(address)
      .then(result => {
          const apps: Promise<Subscription>[] = result.map((app: any, index: number) => getSubscriptionPlan(app.id));
          Promise.all(apps).then(appDetails => {
            const cleanAppDetails = appDetails.filter(_a => _a != null);

            result.forEach((resultItem: any, index: number) => {
              if (cleanAppDetails.find(_app => resultItem.id === _app.id)) {
                result[index]["global-state"] = cleanAppDetails.find(_app => resultItem.id === _app.id);
              }
            });
            const finalResult: any = result.filter((_app: Object) => _app.hasOwnProperty("global-state"));
            setPlans(finalResult);
          })
        });
    }
  }, [address]);


  return (
    <>
      <div className="site-body dashboard-view">
        <h2>
          Supporter Dashboard
        </h2>
        { loading ? <LoadingIcon/> : 
          connected ? 
          <Table>
            <Table.Head>
              <Table.TextHeaderCell>Plan ID</Table.TextHeaderCell>
              <Table.TextHeaderCell>Creator</Table.TextHeaderCell>
              <Table.TextHeaderCell>Plan</Table.TextHeaderCell>
              <Table.TextHeaderCell>Details</Table.TextHeaderCell>
              <Table.TextHeaderCell>Subscription Length</Table.TextHeaderCell>
              <Table.TextHeaderCell>Total Paid</Table.TextHeaderCell>
              <Table.TextHeaderCell>Monthly Price</Table.TextHeaderCell>
              {/* <Table.TextHeaderCell>Your Subscription Start Date</Table.TextHeaderCell> */}
              <Table.TextHeaderCell>Actions</Table.TextHeaderCell>
            </Table.Head>
            <Table.VirtualBody height={240}>
              {plans.map((plan: any) => (
                <Table.Row key={plan.id}>
                  <Table.TextCell>{plan.id}</Table.TextCell>
                  <Table.TextCell>{plan["global-state"].creator_name}</Table.TextCell>
                  <Table.TextCell>{plan["global-state"].plan_name}</Table.TextCell>
                  <Table.TextCell>{plan["global-state"].plan_desc}</Table.TextCell>
                  <Table.TextCell>{plan["local-state"].months_subscribed.i} months</Table.TextCell>
                  <Table.TextCell isNumber>{algosdk.microalgosToAlgos(plan["local-state"].paid.i)} Algo</Table.TextCell>
                  <Table.TextCell isNumber>{algosdk.microalgosToAlgos(plan["global-state"].plan_monthly_price)} Algo</Table.TextCell>
                  {/* <Table.TextCell>{new Date(plan["local-state"].subscription_start_date.i).toString()}</Table.TextCell> */}
                  <Table.TextCell>
                    <Button size="small">Unsubscribe</Button>
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

export default SupporterDashboard;