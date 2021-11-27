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
    plan_name: string = "";
    plan_desc: string = "";
    plan_monthly_price: number = 0;
    created_on: string = "";

    constructor(args: any = {}) { Object.assign(this, args) }
    static fromState(id: number, state: State[]): Subscription {
        const s = StateToObj(state)

        return new Subscription({
            id       : id,
            addr     : algosdk.getApplicationAddress(id),
            creator   : algosdk.encodeAddress(s[StateKeys.creator_key].b),
            creator_name : new TextDecoder().decode(s[StateKeys.creator_name_key].b),
            plan_name : new TextDecoder().decode(s[StateKeys.plan_name_key].b),
            plan_desc : new TextDecoder().decode(s[StateKeys.plan_desc_key].b),
            plan_monthly_price  : s[StateKeys.plan_monthly_price_key].i,
            created_on : new TextDecoder().decode(s[StateKeys.created_on_key].b),
        }) 
    }
}