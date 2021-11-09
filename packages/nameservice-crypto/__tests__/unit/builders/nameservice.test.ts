import "jest-extended";

import { Managers, Transactions } from "@arkecosystem/crypto";

import { NameserviceBuilder } from "../../../src/builders";
import { NameserviceTransaction } from "../../../src/transactions";

describe("Nameservice tests", () => {
    describe("Verify tests", () => {
        Managers.configManager.setFromPreset("testnet");
        Managers.configManager.setHeight(2);
        Transactions.TransactionRegistry.registerTransactionType(NameserviceTransaction);

        it("should verify correctly", () => {
            const actual = new NameserviceBuilder()
                .Nameservice({
                    name: "zan",
                })
                .vendorField("namespace transaction")
                .nonce("4")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            expect(actual.build().verified).toBeTruthy();
            expect(actual.verify()).toBeTruthy();
        });

        it("should verify correctly when Asset method is not on top", () => {
            const actual = new NameserviceBuilder()
                .vendorField("namespace transaction")
                .nonce("4")
                .Nameservice({
                    name: "zan",
                })
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            expect(actual.build().verified).toBeTruthy();
            expect(actual.verify()).toBeTruthy();
        });

        it("should throw pattern exception for name", () => {
            const actual = new NameserviceBuilder()
                .Nameservice({
                    name: "@zan",
                })
                .vendorField("namespace transaction")
                .nonce("4")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            expect(() => actual.build()).toThrow();
        });

        it("should verify correctly fee setup", () => {
            const actual = new NameserviceBuilder()
                .Nameservice({
                    name: "zan",
                })
                .fee("123")
                .nonce("4")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            expect(actual.build().verified).toBeTruthy();
            expect(actual.verify()).toBeTruthy();
        });

        it("object should remain the same if asset is undefined", () => {
            const actual = new NameserviceBuilder();
            actual.data.asset = undefined;

            const result = actual.Nameservice({
                name: "zan",
            });

            expect(actual.data.asset).toBeUndefined();
            expect(actual).toBe(result);
        });
    });
});
