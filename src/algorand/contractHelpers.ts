import Configuration from "./config"
import algosdk, { 
    Transaction, 
    TransactionType,
    decodeAddress,
    encodeUint64,
    OnApplicationComplete,
} from 'algosdk'
import { SignedTxn, sign } from "./wallet";
import { Subscription } from "./subscription";
import programs from "./contract_binaries";


// The keys to the global state parameters to the application
export enum StateKeys  {
    seller_key            = "seller",

    start_time_key        = "start",

    plan_price_key        = "plan_price",
}

// Represents the global-state and global-state-delta we get back from
// AlgodClient requests, state-deltas will contain an action, state will 
// contain the type. In both cases 1 is for bytes, 2 is for ints. We use
// This to convert the array to a more friendly object 
export interface State  {
    key: string
    value: {
        bytes: string
        uint: number
        type?: number
        action?: number
    }
}

// Generic object to hold state keys/values
interface Obj {
   [key: string] : {
       b: Uint8Array
       i: number
   }
}

// Converts an array of global-state or global-state-deltas to a more
// friendly generic object
export function StateToObj(sd: State[]): Obj {
    const obj = {} as Obj

    // Start with empty set
    Object.values(StateKeys).forEach((k)=>{
        obj[k] = {i:0, b: new Uint8Array()}
    })

    for(const idx in sd){
        const key = Buffer.from(sd[idx].key, 'base64').toString()

        // https://github.com/algorand/go-algorand/blob/master/data/basics/teal.go
        // In both global-state and state deltas, 1 is bytes and 2 is int
        const v = sd[idx].value
        const dataTypeFlag = v.action?v.action:v.type
        switch(dataTypeFlag){
            case 1:
                obj[key] = {b:Buffer.from(v.bytes, 'base64'), i:0}
                break;
            case 2:
                obj[key] = {i:v.uint, b:new Uint8Array()}
                break;
            default: // ??
        }
    }

    return obj
}


// Lazy init algod client
let algodClient: algosdk.Algodv2;
export function getAlgodClient(): algosdk.Algodv2 {
    if (algodClient !== undefined) return algodClient

    const token = Configuration.algod.token
    const server= Configuration.algod.host 
    const port  = Configuration.algod.port

    algodClient = new algosdk.Algodv2(token, server, port)

    return algodClient
}

// Lazy init indexer client
let indexerClient: algosdk.Indexer;
function getIndexerClient(): algosdk.Indexer {
    if (indexerClient !== undefined) return indexerClient

    const token = Configuration.indexer.token
    const server= Configuration.indexer.host 
    const port  = Configuration.indexer.port

    indexerClient = new algosdk.Indexer(token, server, port)

    return indexerClient
}

// Get the application by id and construct a Subscription obj using the global-state
export async function getSubscription(appId: number): Promise<Subscription> {
    const client = getAlgodClient()
    const app = await client.getApplicationByID(appId).do()
    return Subscription.fromState(appId, app['params']['global-state'])
}

// Use the indexer to get some transactions up to limit
// Optionally return the next page for seeing more if the user wants to
export async function getSubscribeTransactions(
    appId: number, limit: number, start: number, nextPage: string): Promise<any> {

    const client = getIndexerClient()

    if(start.toString().length>10)
        start = start/1000

    const begin = new Date(0)
    begin.setUTCSeconds(start)

    let req = client.searchForTransactions()
        .applicationID(appId)
        .limit(limit)
        .txType("appl")
        .afterTime(begin.toISOString())

    // If next page is defined, add it to the request
    if(nextPage !== undefined && nextPage !== "")
        req = req.nextToken(nextPage)

    // Return the result of the query
    return await req.do()
}

// Creates a subscription grouped transaction.
// The grouped transaction consists of a payment in the amount they're paying
// and an application call to update the state of the auction
export async function subscribePlan(appId: number, amt: number, address: string, walletType: string, connector: any): Promise<any> {
    // Create transaction
    const client  = getAlgodClient()

    // Get the latest info for the subscription
    const subscription = await getSubscription(appId)

    // Get the bidders account
    const addr = address
    
    // Prepare txn vars
    const appAddr       = subscription.addr
    const appArgs: Uint8Array[] = [new Uint8Array(Buffer.from("bid"))]

    const sp        = await client.getTransactionParams().do()

    const pay_txn   = algosdk.makePaymentTxnWithSuggestedParams(
        addr, appAddr, algosdk.algosToMicroalgos(amt), undefined, undefined, sp
    )
    const app_txn   = algosdk.makeApplicationNoOpTxn(
        addr, sp, appId, appArgs
    )

    algosdk.assignGroupID([pay_txn, app_txn])

    const signed = await sign([pay_txn, app_txn], walletType, connector)
    const result = await sendWait(signed)

    if(result['pool-error']) throw new Error("Place Bid Failed: "+result['pool-error'])
}

// Creates the subscription withe the parameters passed. 
export async function createSubscriptionPlan(plan_price: number, start: number, address: string, walletType: string, connector: any): Promise<number>{

    const client = getAlgodClient()

    // b64 decode the programs into uint8arrays
    const approval  = new Uint8Array(Buffer.from(programs.approval, "base64"))
    const clear     = new Uint8Array(Buffer.from(programs.clear, "base64"))


    // Prepare app args to initialize the subscription
    const addr      = address
    console.log("addr:", decodeAddress(addr).publicKey)
    console.log("start:", start)
    console.log("price:", algosdk.algosToMicroalgos(plan_price))
    const args      = [
        decodeAddress(addr).publicKey,
        encodeUint64(start),
        encodeUint64(algosdk.algosToMicroalgos(plan_price)),
    ]

    const sp = await client.getTransactionParams().do()
    const createTxn = new Transaction({
        from:addr,
        appIndex: 0,
        type: TransactionType.appl,
        appOnComplete: OnApplicationComplete.NoOpOC,
        appApprovalProgram: approval,
        appClearProgram: clear,
        appGlobalInts: 7,
        appGlobalByteSlices: 2,
        appLocalInts: 0,
        appLocalByteSlices: 0,
        appArgs: args,
        suggestedParams: sp
    })
    

    const signed = await sign([createTxn], walletType, connector)
    const result = await sendWait(signed)

    if(result['pool-error']) throw new Error("Create Application failed: "+result['pool-error'])

    return result['application-index']
}

export async function setupSubscription(appId: number, address: string, walletType: string, connector: any) {
    const client = getAlgodClient()

    const addr      = address
    const appAddr   = algosdk.getApplicationAddress(appId)
    const fundAmt   = (
        100000 + // min account balance
        1 * 1000 // 3 * min txn fee
    )

    const sp        = await client.getTransactionParams().do()
    const fundTxn   = algosdk.makePaymentTxnWithSuggestedParams(
        addr, appAddr, fundAmt, undefined, undefined, sp)

    const grouped = [fundTxn]
    algosdk.assignGroupID(grouped)

    const signed = await sign(grouped, walletType, connector)

    const result = await sendWait(signed)

    if(result['pool-error']) throw new Error("Failed to setup subscription: "+result['pool-error'])
}

// Close out the subscription by deleting the application
export async function closeSubscription(appId: number, address: string, walletType: string, connector: any) {
    const client = getAlgodClient()

    const addr      = address
    const accts     = [addr]

    const sp        = await client.getTransactionParams().do()

    const fundTxn   = algosdk.makeApplicationDeleteTxn(addr, sp, appId, undefined, accts)
    const [signed]  = await sign([fundTxn], walletType, connector)

    const result = await sendWait([signed])

    if(result['pool-error']) throw new Error("Failed to close subscription: "+result['pool-error'])
}

// Utility function to block after sending the raw transaction for 3 rounds in this case
export async function sendWait(signed: SignedTxn[]): Promise<any> {
    const client = getAlgodClient()
    console.log("signed map?", signed.map((t)=>{return t.blob}))
    const {txId} = await client.sendRawTransaction(signed.map((t)=>{return t.blob})).do()
    const result = await waitForConfirmation(txId, 3)
    return result 
}

// Continuously poll the pending txn endpoint with the txn id to see if its been confirmed
// At the time of reading, this may have been included in the js-sdk and that one should
// be used instead of this one
async function waitForConfirmation(txId: string, timeout: number): Promise<any> {
    const client = getAlgodClient()

    if (client == null || txId == null || timeout < 0) {
      throw new Error('Bad arguments.');
    }

    const status = await client.status().do();
    if (typeof status === 'undefined')
      throw new Error('Unable to get node status');

    const startround = status['last-round'] + 1;
    let currentround = startround;
  
    /* eslint-disable no-await-in-loop */
    while (currentround < startround + timeout) {
      const pending = await client
        .pendingTransactionInformation(txId)
        .do();

      if (pending !== undefined) {
        if ( pending['confirmed-round'] !== null && pending['confirmed-round'] > 0) 
          return pending;
  
        if ( pending['pool-error'] != null && pending['pool-error'].length > 0) 
          throw new Error( `Transaction Rejected pool error${pending['pool-error']}`);
      }

      await client.statusAfterBlock(currentround).do();
      currentround += 1;
    }

    /* eslint-enable no-await-in-loop */
    throw new Error(`Transaction not confirmed after ${timeout} rounds!`);
}