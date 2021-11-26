from pyteal import *

def approval_program():
    seller_key = Bytes("seller")
    start_time_key = Bytes("start")
    plan_price_key = Bytes("plan_price")
    num_subscribers_key = Bytes("num_subscribers")

    @Subroutine(TealType.none)
    def closeAccountTo(account: Expr) -> Expr:
        return If(Balance(Global.current_application_address()) != Int(0)).Then(
            Seq(
                InnerTxnBuilder.Begin(),
                InnerTxnBuilder.SetFields(
                    {
                        TxnField.type_enum: TxnType.Payment,
                        TxnField.close_remainder_to: account,
                    }
                ),
                InnerTxnBuilder.Submit(),
            )
        )

    on_create_start_time = Btoi(Txn.application_args[1])
    on_create = Seq(
        App.globalPut(seller_key, Txn.application_args[0]),
        App.globalPut(start_time_key, on_create_start_time),
        App.globalPut(plan_price_key, Btoi(Txn.application_args[2])),
        Assert(
            Global.latest_timestamp() < on_create_start_time
        ),
        Approve(),
    )

    on_setup = Seq(
        Assert(Global.latest_timestamp() < App.globalGet(start_time_key)),
        # we'll use to make sure the contract has been set up
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields(
            {
                TxnField.type_enum: TxnType.AssetTransfer,
                TxnField.asset_receiver: Global.current_application_address(),
            }
        ),
        InnerTxnBuilder.Submit(),
        Approve(),
    )

    on_subscribe_txn_index = Txn.group_index() - Int(1)
    on_subscribe = Seq(
        Assert(
            And(
                # the subscription plan has been set up
                # the subscription plan has started
                App.globalGet(start_time_key) <= Global.latest_timestamp(),
                # the actual payment is before the app call
                Gtxn[on_subscribe_txn_index].type_enum() == TxnType.Payment,
                Gtxn[on_subscribe_txn_index].sender() == Txn.sender(),
                Gtxn[on_subscribe_txn_index].receiver()
                == Global.current_application_address(),
                Gtxn[on_subscribe_txn_index].amount() >= Global.min_txn_fee(),
            )
        ),
        Seq(
            App.globalPut(num_subscribers_key, App.globalGet(num_subscribers_key) + Int(1)),
            Approve(),
        ),
        Reject(),
    )

    on_call_method = Txn.application_args[0]
    on_call = Cond(
        [on_call_method == Bytes("setup"), on_setup],
        [on_call_method == Bytes("subscribe"), on_subscribe],
    )

    on_delete = Seq(
        If(Global.latest_timestamp() < App.globalGet(start_time_key)).Then(
            Seq(
                # the plan has not yet started, it's ok to delete
                Assert(
                    Or(
                        # sender must either be the seller or the subscription plan creator
                        Txn.sender() == App.globalGet(seller_key),
                        Txn.sender() == Global.creator_address(),
                    )
                ),
                # if the subscription contract still has funds, send them all to the seller
                closeAccountTo(App.globalGet(seller_key)),
                Approve(),
            )
        ),
        Reject(),
    )

    return Cond(
        [Txn.application_id() == Int(0), on_create],
        [Txn.on_completion() == OnComplete.NoOp, on_call],
        [
            Txn.on_completion() == OnComplete.DeleteApplication,
            on_delete,
        ],
        [
            Or(
                Txn.on_completion() == OnComplete.OptIn,
                Txn.on_completion() == OnComplete.CloseOut,
                Txn.on_completion() == OnComplete.UpdateApplication,
            ),
            Reject(),
        ],
    )


def clear_state_program():
    return Approve()


if __name__ == "__main__":
    with open("subscribe_approval.teal", "w") as f:
        compiled = compileTeal(approval_program(), mode=Mode.Application, version=5)
        f.write(compiled)

    with open("subscribe_clear_state.teal", "w") as f:
        compiled = compileTeal(clear_state_program(), mode=Mode.Application, version=5)
        f.write(compiled)
