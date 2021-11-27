from pyteal import *

def approval_program():
    creator_key = Bytes("creator")
    plan_creator_name_key = Bytes("creator_name")
    plan_name_key = Bytes("plan_name")
    plan_desc_key = Bytes("plan_desc")
    plan_monthly_price_key = Bytes("plan_monthly_price")
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

    on_create = Seq(
        App.globalPut(creator_key, Txn.application_args[0]),
        App.globalPut(plan_creator_name_key, Txn.application_args[1]),
        App.globalPut(plan_name_key, Txn.application_args[2]),
        App.globalPut(plan_desc_key, Txn.application_args[3]),
        App.globalPut(plan_monthly_price_key, Btoi(Txn.application_args[4])),
        App.globalPut(Bytes("created_on"), Bytes("Subscrypt")),
        Assert(
            BytesGt(plan_monthly_price_key, Itob(Int(0)))
        ),
        Approve(),
    )

    on_setup = Seq(
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
    number_of_months = Gtxn[on_subscribe_txn_index].amount() / App.globalGet(plan_monthly_price_key)
    on_subscribe = Seq(
        Assert(
            And(
                Gtxn[on_subscribe_txn_index].type_enum() == TxnType.Payment,
                Gtxn[on_subscribe_txn_index].sender() == Txn.sender(),
                Gtxn[on_subscribe_txn_index].receiver()
                == Global.current_application_address(),
                Gtxn[on_subscribe_txn_index].amount() >= Global.min_txn_fee(),
                number_of_months >= Int(1)
            )
        ),
        Seq(
            App.globalPut(num_subscribers_key, App.globalGet(num_subscribers_key) + Int(1)),
            App.localPut(Int(0), Bytes("paid"), Gtxn[on_subscribe_txn_index].amount()),
            App.localPut(Int(0), Bytes("months_subscribed"), number_of_months),
            App.localPut(Int(0), Bytes("subscription_start_date"), Global.latest_timestamp()),
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
        Assert(
            Or(
                # sender must either be the creator
                Txn.sender() == App.globalGet(creator_key),
                Txn.sender() == Global.creator_address(),
            )
        ),
        Seq(
            # if the subscription contract still has funds, send them all to the creator
            closeAccountTo(App.globalGet(creator_key)),
            Approve(),
        ),
        Reject(),
    )

    return Cond(
        [Txn.application_id() == Int(0), on_create],
        [Txn.on_completion() == OnComplete.NoOp, on_call],
        [Txn.on_completion() == OnComplete.OptIn, Approve()],
        [
            Txn.on_completion() == OnComplete.DeleteApplication,
            on_delete,
        ],
        [
            Or(
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