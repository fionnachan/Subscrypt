import Configuration from "./config.testnet";

export interface ApiConf {
    host: string
    port: number
    token: string
}

export interface Config {
    explorer: string
    algod:  ApiConf 
    indexer:  ApiConf
    network: string
}

export default Configuration