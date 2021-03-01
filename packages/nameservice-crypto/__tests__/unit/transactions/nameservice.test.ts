import "jest-extended";

import { Managers, Transactions } from "@arkecosystem/crypto";

import { NameserviceBuilder } from "../../../src/builders";
import { NameserviceTransaction } from "../../../src/transactions";

describe("NFT Burn tests", () => {
    Managers.configManager.setFromPreset("testnet");
    Managers.configManager.setHeight(2);
    Transactions.TransactionRegistry.registerTransactionType(NameserviceTransaction);

    describe("Ser/deser tests", () => {
        it("should ser/deser correctly", () => {
            const actual = new NameserviceBuilder()
                .Nameservice({
                    name: "zan",
                })
                .vendorField("namespace transaction")
                .nonce("4")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
                .getStruct();

            const serialized = Transactions.TransactionFactory.fromData(actual).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            expect(deserialized.data.asset!.nameservice).toStrictEqual({
                name: "zan",
            });
        });

        it("should throw if asset is undefined", () => {
            const actual = new NameserviceBuilder()
                .Nameservice({
                    name: "zan",
                })
                .nonce("3");

            actual.data.asset = undefined;
            expect(() => actual.sign("passphrase")).toThrow();
        });
    });
});
