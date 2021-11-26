import Configuration from "./config.testnet";

interface ApiConf {
    host: string
    port: number
    token: string
}

interface Config {
    explorer: string
    algod:  ApiConf 
    indexer:  ApiConf
    network: string
}

export default Configuration