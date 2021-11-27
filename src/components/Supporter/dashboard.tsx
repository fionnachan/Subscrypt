import { Button, Table, TextareaField, TextInputField } from 'evergreen-ui';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectAddress, selectConnected, selectWalletType, selectConnector, selectFetching } from '../../features/walletSlice';
import { closeSubscription, createSubscriptionPlan, setupSubscription, subscribePlan } from '../../algorand/contractHelpers';
import { setIsNotificationOpen, setNotificationContent, setNotificationTitle } from '../../features/applicationSlice';
import LoadingIcon from '../LoadingIcon';

const SupporterDashboard: React.FC = () => {
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
  useEffect(() => {
    // if (!creatorName || !planName || !planDesc || !price) {
    //   return;
    // }
    // const subscriptionId = await subscribePlan(
    //                             creatorName,
    //                             planName,
    //                             planDesc,
    //                             parseInt(price),
    //                             address,
    //                             walletType,
    //                             connector);

    // await setupSubscription(subscriptionId, address, walletType, connector)
    //     .then(result => {
    //       console.log("result: ", result)
    //       dispatch(setIsNotificationOpen(true));
    //       dispatch(setNotificationTitle("Subscription Success"))
    //       dispatch(setNotificationContent("Confirmed at round "+result["confirmed-round"]))
    //     })
    //     .catch(error => {
    //       dispatch(setIsNotificationOpen(true));
    //       dispatch(setNotificationTitle("Subscription Error"))
    //       dispatch(setNotificationContent(error))
    //     });
  }, [address, walletType, connector]);

  const profiles = [
    {
      name: "AlgoChap's diamondhands plan",
      planAppId: "47709978",
      paid: 10,
      subscribedMonths: 6,
      expiryDate: new Date(1648291848616).toString()
    },
    {
      name: "AlgoKitties",
      planAppId: "47701022",
      paid: 12,
      subscribedMonths: 6,
      expiryDate: new Date(1649591848616).toString()
    },
  ]

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
              <Table.SearchHeaderCell />
              <Table.TextHeaderCell>Active Subscription Plan ID</Table.TextHeaderCell>
              <Table.TextHeaderCell>Deposit</Table.TextHeaderCell>
              <Table.TextHeaderCell>Expiry Date</Table.TextHeaderCell>
              <Table.TextHeaderCell>Actions</Table.TextHeaderCell>
            </Table.Head>
            <Table.VirtualBody height={240}>
              {profiles.map((profile) => (
                <Table.Row key={profile.planAppId} isSelectable onSelect={() => alert(profile.name)}>
                  <Table.TextCell>{profile.name}</Table.TextCell>
                  <Table.TextCell>{profile.planAppId}</Table.TextCell>
                  <Table.TextCell isNumber>{profile.paid}</Table.TextCell>
                  <Table.TextCell>{profile.expiryDate}</Table.TextCell>
                  <Table.TextCell>
                    <Button size="small">Cancel</Button>
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