import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";

import { NameServiceTransactionGroup, NameServiceTransactionTypes, NameServiceTransactionVersion } from "../enums";
import { INameServiceAsset } from "../interfaces";
import { NameserviceTransaction } from "../transactions";

export class NameserviceBuilder extends Transactions.TransactionBuilder<NameserviceBuilder> {
    public constructor() {
        super();
        this.data.version = NameServiceTransactionVersion;
        this.data.typeGroup = NameServiceTransactionGroup;
        this.data.type = NameServiceTransactionTypes.Nameservice;
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.fee = NameserviceTransaction.staticFee();
        this.data.asset = { nameservice: {} };
    }

    public Nameservice(nameservice: INameServiceAsset): NameserviceBuilder {
        if (this.data.asset) {
            this.data.asset.nameservice = nameservice;
        }
        return this;
    }

    public getStruct(): Interfaces.ITransactionData {
        const struct: Interfaces.ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        struct.vendorField = this.data.vendorField;

        return struct;
    }

    protected instance(): NameserviceBuilder {
        return this;
    }
}
