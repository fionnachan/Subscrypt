
import algosdk, {Transaction} from "algosdk"
import { formatJsonRpcRequest } from "@json-rpc-tools/utils";

export interface SignedTxn {
    txID: string
    blob: Uint8Array
}


export async function sign(txns: Transaction[], walletType: string, connector: any): Promise<SignedTxn[]> {

    const txnsToSign = txns.map((txn) => {
        const encodedTxn = Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString("base64");

        return {txn: encodedTxn};
    })

    const request = formatJsonRpcRequest("algo_signTxn", [txnsToSign]);
    
    let result: string[] = [];
    if (walletType === "walletConnect") {
      result = await connector.sendCustomRequest(request);
    } else if (walletType === "myAlgo") {
      result = await connector.signTransaction([txnsToSign]);
    } else if (walletType === "algoSigner") {
      result = await connector.signTxn([txnsToSign]);
    }
    console.log("RESULT: ",result);

    return result.map((element, idx) => {
      console.log("Element: ", element)
      return element ? {
          txID: txns[idx].txID(), 
          blob: new Uint8Array(Buffer.from((element as any).blob, "base64"))
        } : {
          txID:txns[idx].txID(), 
          blob:new Uint8Array()
        };
    });
}