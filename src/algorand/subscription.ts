import algosdk from 'algosdk'
import {
    State, 
    StateKeys,
    StateToObj,
} from './contractHelpers'

export class Subscription {
    id: number = 0;
    addr: string = "";
    creator: string = "";
    creator_name: string = "";
    plan_monthly_price: number = 0;
    created_on: string = "";

    constructor(args: any = {}) { Object.assign(this, args) }
    static fromState(id: number, state: State[]): Subscription {
        const s = StateToObj(state)

        return new Subscription({
            id       : id,
            addr     : algosdk.getApplicationAddress(id),
            creator   : algosdk.encodeAddress(s[StateKeys.creator_key].b),
            plan_monthly_price  : s[StateKeys.plan_monthly_price_key].i,
        }) 
    }
}