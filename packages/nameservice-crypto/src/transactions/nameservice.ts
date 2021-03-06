import { Transactions, Utils } from "@arkecosystem/crypto";
import { Asserts } from "@protokol/utils";
import ByteBuffer from "bytebuffer";

import {
    NameServiceStaticFees,
    NameServiceTransactionGroup,
    NameServiceTransactionTypes,
    NameServiceTransactionVersion,
} from "../enums";
import { INameServiceAsset } from "../interfaces";
import { amountSchema, nameserviceSchema, vendorFieldSchema } from "./utils/nameservice-schemas";

const { schemas } = Transactions;

export class NameserviceTransaction extends Transactions.Transaction {
    public static typeGroup: number = NameServiceTransactionGroup;
    public static type = NameServiceTransactionTypes.Nameservice;
    public static key = "Nameservice";
    public static version: number = NameServiceTransactionVersion;

    protected static defaultStaticFee = Utils.BigNumber.make(NameServiceStaticFees.Nameservice);

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: this.key,
            required: ["asset", "typeGroup"],
            properties: {
                type: { transactionType: this.type },
                typeGroup: { const: this.typeGroup },
                amount: amountSchema,
                vendorField: vendorFieldSchema,
                asset: {
                    type: "object",
                    required: ["nameservice"],
                    properties: {
                        nameservice: nameserviceSchema,
                    },
                },
            },
        });
    }

    public serialize(): ByteBuffer {
        const { data } = this;

        Asserts.assert.defined<INameServiceAsset>(data.asset?.nameservice);
        const nameserviceAsset: INameServiceAsset = data.asset.nameservice;

        const hashBuffer: Buffer = Buffer.from(nameserviceAsset.name);
        const buffer: ByteBuffer = new ByteBuffer(1 + hashBuffer.length, true);

        // name
        buffer.writeByte(hashBuffer.length);
        buffer.append(hashBuffer, "hex");

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        // name
        const nameLength: number = buf.readUint8();
        const name: string = buf.readString(nameLength);

        const nameservice: INameServiceAsset = { name };

        data.asset = {
            nameservice,
        };
    }

    public hasVendorField(): boolean {
        return true;
    }
}
