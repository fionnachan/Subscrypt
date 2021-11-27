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
    creator_key            = "creator",
    creator_name_key        = "creator_name",
    plan_name_key        = "plan_name",
    plan_desc_key        = "plan_desc",
    plan_monthly_price_key        = "plan_monthly_price",
    created_on_key        = "created_on",
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
export async function getSubscriptionPlan(appId: number): Promise<Subscription> {
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
// and an application call to update the state of the subscription plan contract
export async function subscribePlan(appId: number, amt: number, address: string, walletType: string, connector: any): Promise<any> {
    // Create transaction
    const client  = getAlgodClient()

    // Get the latest info for the subscription
    const subscription = await getSubscriptionPlan(appId)

    // Get the supporter's account
    const addr = address
    
    // Prepare txn vars
    const appAddr       = subscription.addr
    const appArgs: Uint8Array[] = [new Uint8Array(Buffer.from("subscribe"))]

    const sp        = await client.getTransactionParams().do()

    console.log("IN HERE")

    const pay_txn   = algosdk.makePaymentTxnWithSuggestedParams(
        addr, appAddr, algosdk.algosToMicroalgos(amt), undefined, undefined, sp
    );

    const app_opt_in_txn = algosdk.makeApplicationOptInTxn(
      addr, sp, appId
    );

    const app_txn   = algosdk.makeApplicationNoOpTxn(
        addr, sp, appId, appArgs
    );

    const txns = [];

    const userHasOptedInApp = await hasOptedInApp(addr, appId);

    if (!userHasOptedInApp) {
      txns.push(app_opt_in_txn);
    }
   
    txns.push(pay_txn, app_txn);

    algosdk.assignGroupID(txns)

    const signed = await sign(txns, walletType, connector)
    const result = await sendWait(signed)

    if(result['pool-error']) throw new Error("Subscription Failed: "+result['pool-error'])

    return result;
}

export async function hasOptedInApp(addr: string, appId: number) {
  const client = getAlgodClient()
  const ai = await client.accountInformation(addr).do()

  // Already opted in
  return (ai['apps-local-state'].some((a: any)=> a['id'] == appId));
}

// Creates the subscription withe the parameters passed. 
export async function createSubscriptionPlan(
                                            creatorName: string,
                                            planName: string,
                                            planDesc: string,
                                            planPrice: number,
                                            address: string,
                                            walletType: string,
                                            connector: any): Promise<number>{

    const client = getAlgodClient()

    // b64 decode the programs into uint8arrays
    const approval  = new Uint8Array(Buffer.from(programs.approval, "base64"))
    const clear     = new Uint8Array(Buffer.from(programs.clear, "base64"))

    // Prepare app args to initialize the subscription
    const addr      = address
    const args      = [
        decodeAddress(addr).publicKey,
        new Uint8Array(Buffer.from(creatorName)),
        new Uint8Array(Buffer.from(planName)),
        new Uint8Array(Buffer.from(planDesc)),
        encodeUint64(algosdk.algosToMicroalgos(planPrice)),
    ]

    const sp = await client.getTransactionParams().do()
    const createTxn = new Transaction({
        from:addr,
        appIndex: 0,
        type: TransactionType.appl,
        appOnComplete: OnApplicationComplete.NoOpOC,
        appApprovalProgram: approval,
        appClearProgram: clear,
        appGlobalInts: 2,
        appGlobalByteSlices: 5,
        appLocalInts: 3,
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

    return result;

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

    return result;
}

// Utility function to block after sending the raw transaction for 3 rounds in this case
export async function sendWait(signed: SignedTxn[]): Promise<any> {
    const client = getAlgodClient()
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

// read local state of application from user account
export async function readLocalState(address: string, appId: number){
    const client = getAlgodClient()
    let accountInfoResponse = await client.accountInformation(address).do();
    for (let i = 0; i < accountInfoResponse['apps-local-state'].length; i++) { 
        if (accountInfoResponse['apps-local-state'][i].id == appId) {
            console.log("User's local state:");
            for (let n = 0; n < accountInfoResponse['apps-local-state'][i][`key-value`].length; n++) {
                console.log(accountInfoResponse['apps-local-state'][i][`key-value`][n]);
            }
        }
    }
}

export async function getUserSubscribedPlans(address: string) {
  const client = getAlgodClient()
  let accountInfoResponse = await client.accountInformation(address).do();
  const apps = accountInfoResponse['apps-local-state'];
  const processedAppsDetails: any = [];
  apps.forEach((app: any) => {
    const appsKVpairs = StateToObj(app["key-value"]);
    const processedAppsKVpairs = processObj(appsKVpairs);
    processedAppsDetails.push({
      "id": app.id,
      "local-state": processedAppsKVpairs
    })
  });
  return processedAppsDetails;
}

// read global state of application
export async function getAppGlobalState(appId: number){
  const client = getAlgodClient()
  let appInfoResponse = await client.getApplicationByID(appId).do();
  console.log("appInfoResponse: ",appInfoResponse)
  return appInfoResponse["params"]["global-state"];
}

export async function getUserCreatedPlans(address: string){
  const client = getAlgodClient()
  let accountInfoResponse = await client.accountInformation(address).do();
  let createdApps = accountInfoResponse['created-apps'];
  let userCreatedSubscriptionPlans: any = [];
  createdApps.forEach((appInfo: any) => {
    const obj = StateToObj(appInfo["params"]["global-state"]);
    const processedObj: any = processObj(obj);
    if (processedObj["created_on"] === "Subscrypt") {
      userCreatedSubscriptionPlans.push({
        appId: appInfo.id,
        globalState: processedObj
      })
    }
  })
  console.log("userCreatedSubscriptionPlans: ", userCreatedSubscriptionPlans)
  return userCreatedSubscriptionPlans;
}

function processObj(obj: Obj) {
  const processedObj: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key != "creator" && value.i === 0) {
      processedObj[key] = new TextDecoder().decode(value.b);
    } else {
      processedObj[key] = value;
    }
  }

  return processedObj;
}