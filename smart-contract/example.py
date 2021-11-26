from time import time, sleep

from algosdk.logic import get_application_address
from subscription.operations import createSubscriptionPlan, setupSubscriptionPlan, subscribeToPlan, closeSubscription
from subscription.util import (
    getBalances,
    getLastBlockTimestamp,
)
from subscription.testing.setup import getAlgodClient
from subscription.testing.resources import (
    getTemporaryAccount,
)

def simple_subscription():
    client = getAlgodClient()

    print("Alice is generating temporary accounts...")
    creator = getTemporaryAccount(client)
    seller = getTemporaryAccount(client)
    startTime = int(time())
    planPrice = 1_000_000  # 1 Algo

    print(
        "Alice is creating a subscription smart contract with a plan price of 1 Algo..."
    )
    appID = createSubscriptionPlan(
        client=client,
        sender=creator,
        seller=seller.getAddress(),
        startTime=startTime,
        planPrice=planPrice
    )
    print("Alice is setting up and funding the smart contract...")
    setupSubscriptionPlan(
        client=client,
        appID=appID,
        funder=creator,
        planPrice=planPrice
    )

    sellerAlgosBefore = getBalances(client, seller.getAddress())[0]

    print("Alice's algo balance: ", sellerAlgosBefore, " algos")

    subscriber = getTemporaryAccount(client)

    _, lastRoundTime = getLastBlockTimestamp(client)
    if lastRoundTime < startTime + 5:
        sleep(startTime + 5 - lastRoundTime)
    actualAppBalancesBefore = getBalances(client, get_application_address(appID))
    print("The smart contract now holds the following:", actualAppBalancesBefore)
    subscriberAlgosBefore = getBalances(client, subscriber.getAddress())[0]
    print("Bog has ", subscriberAlgosBefore, " Algos")

    print("Bob subscribes to the plan....")
    subscribeToPlan(client=client, appID=appID, subscriber=subscriber)

    _, lastRoundTime = getLastBlockTimestamp(client)

    print("Alice is closing out the subscription....")
    closeSubscription(client, appID, seller)

    actualAppBalances = getBalances(client, get_application_address(appID))
    expectedAppBalances = {0: 0}
    print("The smart contract now holds the following:", actualAppBalances)
    assert actualAppBalances == expectedAppBalances


    actualSellerBalances = getBalances(client, seller.getAddress())
    print("Alice's balances after subscription: ", actualSellerBalances, " Algos")
    actualSubscriberBalances = getBalances(client, subscriber.getAddress())
    print("Bob's balances after subscription: ", actualSubscriberBalances, " Algos")
    assert len(actualSellerBalances) == 1
    # seller should receive the plan price amount, minus the txn fee
    assert actualSellerBalances[0] >= sellerAlgosBefore + planPrice - 1_000


simple_subscription()
