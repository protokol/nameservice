import "@arkecosystem/core-test-framework/dist/matchers";

import { Contracts } from "@arkecosystem/core-kernel";
import { passphrases, snoozeForBlock } from "@arkecosystem/core-test-framework";
import { Identities } from "@arkecosystem/crypto";
import { generateMnemonic } from "bip39";

import * as support from "../__support__";
import { NamespaceTransactionFactory } from "../__support__/transaction-factory";

let app: Contracts.Kernel.Application;
beforeAll(async () => (app = await support.setUp()));
afterAll(async () => await support.tearDown());

describe("Nameservice functional tests - Signed with 2 Passphrases", () => {
    it("should broadcast, accept and forge it [Signed with 2 Passphrases]", async () => {
        // Prepare a fresh wallet for the tests
        const passphrase = generateMnemonic();
        const secondPassphrase = generateMnemonic();

        // Initial Funds
        const initialFunds = NamespaceTransactionFactory.initialize(app)
            .transfer(Identities.Address.fromPassphrase(passphrase), 150 * 1e8)
            .withPassphrase(passphrases[0]!)
            .createOne();

        await expect(initialFunds).toBeAccepted();
        await snoozeForBlock(1);
        await expect(initialFunds.id).toBeForged();

        // Register a second passphrase
        const secondSignature = NamespaceTransactionFactory.initialize(app)
            .secondSignature(secondPassphrase)
            .withPassphrase(passphrase)
            .createOne();

        await expect(secondSignature).toBeAccepted();
        await snoozeForBlock(1);
        await expect(secondSignature.id).toBeForged();

        // Save name
        const nameservice = NamespaceTransactionFactory.initialize(app)
            .Nameservice({ name: "zan" })
            .withPassphrase(passphrase)
            .withSecondPassphrase(secondPassphrase)
            .createOne();

        await expect(nameservice).toBeAccepted();
        await snoozeForBlock(1);
        await expect(nameservice.id).toBeForged();
    });
});
