# 27 Nov 2021: This is not up-to-date.
from typing import Tuple, List

from algosdk.v2client.algod import AlgodClient
from algosdk.future import transaction
from algosdk.logic import get_application_address
from algosdk import account, encoding

from pyteal import compileTeal, Mode

from .account import Account
from .contracts import approval_program, clear_state_program
from .util import (
    waitForTransaction,
    fullyCompileContract,
    getAppGlobalState,
)

APPROVAL_PROGRAM = b""
CLEAR_STATE_PROGRAM = b""

def getContracts(client: AlgodClient) -> Tuple[bytes, bytes]:
    """Get the compiled TEAL contracts for the subscription plan.

    Args:
        client: An algod client that has the ability to compile TEAL programs.

    Returns:
        A tuple of 2 byte strings. The first is the approval program, and the
        second is the clear state program.
    """
    global APPROVAL_PROGRAM
    global CLEAR_STATE_PROGRAM

    if len(APPROVAL_PROGRAM) == 0:
        APPROVAL_PROGRAM = fullyCompileContract(client, approval_program())
        CLEAR_STATE_PROGRAM = fullyCompileContract(client, clear_state_program())

    return APPROVAL_PROGRAM, CLEAR_STATE_PROGRAM


def createSubscriptionPlan(
    client: AlgodClient,
    sender: Account,
    seller: str,
    startTime: int,
    planPrice: int,
) -> int:
    """Create a new subscription plan.

    Args:
        client: An algod client.
        sender: The account that will create the subscription plan.
        seller: The address of the creator that is going to provide the subscription service.
        startTime: A UNIX timestamp representing the start time of the subscription plan.
            This must be greater than the current UNIX timestamp.
        planPrice: The price of the subscription plan.

    Returns:
        The ID of the newly created subscription contract.
    """
    approval, clear = getContracts(client)

    globalSchema = transaction.StateSchema(num_uints=7, num_byte_slices=2)
    localSchema = transaction.StateSchema(num_uints=0, num_byte_slices=0)

    app_args = [
        encoding.decode_address(seller),
        startTime.to_bytes(8, "big"),
        planPrice.to_bytes(8, "big"),
    ]

    txn = transaction.ApplicationCreateTxn(
        sender=sender.getAddress(),
        on_complete=transaction.OnComplete.NoOpOC,
        approval_program=approval,
        clear_program=clear,
        global_schema=globalSchema,
        local_schema=localSchema,
        app_args=app_args,
        sp=client.suggested_params(),
    )

    signedTxn = txn.sign(sender.getPrivateKey())

    client.send_transaction(signedTxn)

    response = waitForTransaction(client, signedTxn.get_txid())
    assert response.applicationIndex is not None and response.applicationIndex > 0
    return response.applicationIndex


def setupSubscriptionPlan(
    client: AlgodClient,
    appID: int,
    funder: Account,
    planPrice: int,
) -> None:
    """Finish setting up a subscription plan.

    This operation funds the subscription plan escrow account. The subsription plan must not have started yet.

    The escrow account requires a total of 0.203 Algos for funding. See the code
    below for a breakdown of this amount.

    Args:
        client: An algod client.
        appID: The app ID of the subscription plan.
        funder: The account providing the funding for the escrow account.
        planPrice: The Plan Price.
    """
    appAddr = get_application_address(appID)

    suggestedParams = client.suggested_params()

    fundingAmount = (
        # min account balance
        100_000
        # 1 * min txn fee
        + 1 * 1_000
    )

    fundAppTxn = transaction.PaymentTxn(
        sender=funder.getAddress(),
        receiver=appAddr,
        amt=fundingAmount,
        sp=suggestedParams,
    )

    transaction.assign_group_id([fundAppTxn])

    signedFundAppTxn = fundAppTxn.sign(funder.getPrivateKey())

    client.send_transactions([signedFundAppTxn])

    waitForTransaction(client, signedFundAppTxn.get_txid())


def subscribeToPlan(client: AlgodClient, appID: int, subscriber: Account) -> None:
    """Subscribe to the plan.

    Args:
        client: An Algod client.
        appID: The app ID of the subscription plan.
        subscriber: The account subscribing.
    """
    appAddr = get_application_address(appID)
    appGlobalState = getAppGlobalState(client, appID)
    planPrice = appGlobalState[b"plan_price"]


    suggestedParams = client.suggested_params()

    payTxn = transaction.PaymentTxn(
        sender=subscriber.getAddress(),
        receiver=appAddr,
        amt=planPrice,
        sp=suggestedParams,
    )

    appCallTxn = transaction.ApplicationCallTxn(
        sender=subscriber.getAddress(),
        index=appID,
        on_complete=transaction.OnComplete.NoOpOC,
        app_args=[b"subscribe"],
        sp=suggestedParams,
    )

    transaction.assign_group_id([payTxn, appCallTxn])

    signedPayTxn = payTxn.sign(subscriber.getPrivateKey())
    signedAppCallTxn = appCallTxn.sign(subscriber.getPrivateKey())

    client.send_transactions([signedPayTxn, signedAppCallTxn])

    waitForTransaction(client, appCallTxn.get_txid())


def closeSubscription(client: AlgodClient, appID: int, closer: Account):
    """Close a subscription plan.

    This action can only happen before a subscription plan has begun, in which case it is
    cancelled, or after a subscription plan has ended.

    Args:
        client: An Algod client.
        appID: The app ID of the subscription plan.
        closer: The account initiating the close transaction. This must be
            either the seller or subscription plan creator.
    """
    appGlobalState = getAppGlobalState(client, appID)

    accounts: List[str] = [encoding.encode_address(appGlobalState[b"seller"])]

    if any(appGlobalState[b"subscriber_list"]):
        # if "subscriber_list" is not the zero address
        accounts.append(encoding.encode_address(appGlobalState[b"subscriber_list"]))

    deleteTxn = transaction.ApplicationDeleteTxn(
        sender=closer.getAddress(),
        index=appID,
        accounts=accounts,
        sp=client.suggested_params(),
    )
    signedDeleteTxn = deleteTxn.sign(closer.getPrivateKey())

    client.send_transaction(signedDeleteTxn)

    waitForTransaction(client, signedDeleteTxn.get_txid())
