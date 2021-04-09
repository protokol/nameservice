import "jest-extended";

import { Application } from "@arkecosystem/core-kernel";
import { Generators } from "@arkecosystem/core-test-framework";
import { Managers } from "@arkecosystem/crypto";
import { Defaults as CryptoDefaults } from "@protokol/nameservice-crypto";
import { Defaults as TransactionsDefaults } from "@protokol/nameservice-transactions";
import latestVersion from "latest-version";

import { ConfigurationController } from "../../../src/controllers/configurations";
import { initApp, ItemResponse } from "../__support__";

let app: Application;

let configurationsController: ConfigurationController;

beforeEach(() => {
    const config = Generators.generateCryptoConfigRaw();
    Managers.configManager.setConfig(config);

    app = initApp();

    configurationsController = app.resolve<ConfigurationController>(ConfigurationController);
});

describe("Test configurations controller", () => {
    it("index - return package name and version and crypto and transactions default settings", async () => {
        const response = (await configurationsController.index(undefined, undefined)) as ItemResponse;
        const plugin = require("../../../package.json");

        expect(response.data).toStrictEqual({
            package: {
                name: plugin.name,
                currentVersion: plugin.version,
                latestVersion: await latestVersion(plugin.name),
            },
            crypto: CryptoDefaults,
            transactions: TransactionsDefaults,
        });
    });
});
