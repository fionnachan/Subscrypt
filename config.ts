import algosdk from "algosdk"

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
  accts?: {[key: string]: algosdk.Account}
}

const Configuration = require("~/static/config.sandnet.json") as Config

export default Configuration