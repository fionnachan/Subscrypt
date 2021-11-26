import algosdk from 'algosdk'
import {
    State, 
    StateKeys,
    StateToObj,

    getSubscription,

    createSubscriptionPlan,
    setupSubscription,
    closeSubscription,
    subscribePlan
} from './contractHelpers'

export class Subscription {
    id: number = 0;
    addr: string = "";
    seller: string = "";
    plan_price: number = 0;
    start: number = 0;

    constructor(args: any = {}) { Object.assign(this, args) }
    static fromState(id: number, state: State[]): Subscription {
        const s = StateToObj(state)

        const start = s[StateKeys.start_time_key].i

        return new Subscription({
            id       : id,
            addr     : algosdk.getApplicationAddress(id),
            seller   : algosdk.encodeAddress(s[StateKeys.seller_key].b),
            start    : start.toString().length>10?start/1000:start,
            plan_price  : s[StateKeys.plan_price_key].i,
        }) 
    }

    // static async create(plan_price: number, start: number): Promise<Subscription> {
    //     const appId = await createSubscriptionPlan(plan_price, start)
    //     return getSubscription(appId)
    // }
    // async setup() { await setupSubscription(this.id) }
    // async close() { await closeSubscription(this.id) }

    // async subscribe(amt: number) { await subscribePlan(this.id, amt) }
}