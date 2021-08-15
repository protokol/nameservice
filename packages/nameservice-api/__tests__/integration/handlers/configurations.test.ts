import "@arkecosystem/core-test-framework/dist/matchers";

import { Contracts } from "@arkecosystem/core-kernel";
import { ApiHelpers } from "@arkecosystem/core-test-framework";
import latestVersion from "latest-version";

import { Defaults as CryptoDefaults } from "../../../../nameservice-crypto";
import { Defaults as TransactionsDefaults } from "../../../../nameservice-transactions";
import { defaults } from "../../../src";
import { setUp, tearDown } from "../__support__/setup";

jest.setTimeout(30000);

let app: Contracts.Kernel.Application;
let api: ApiHelpers;

beforeAll(async () => {
    app = await setUp();
    api = new ApiHelpers(app);
});

afterAll(async () => await tearDown());

describe("API - Configurations", () => {
    describe("GET /nameservice/configurations", () => {
        it("should GET nameservice-api configurations data", async () => {
            const plugin = require("../../../package.json");
            const response = await api.request("GET", "nameservice/configurations");
            expect(response).toBeSuccessfulResponse();

            expect(response.data.data).toStrictEqual({
                api: {
                    packageName: plugin.name,
                    currentVersion: plugin.version,
                    latestVersion: await latestVersion(plugin.name),
                    defaults: defaults,
                },
                transactions: {
                    packageName: "@protokol/nameservice-transactions",
                    currentVersion: plugin.version,
                    latestVersion: await latestVersion("@protokol/nameservice-transactions"),
                    defaults: TransactionsDefaults,
                },
                crypto: {
                    packageName: "@protokol/nameservice-crypto",
                    currentVersion: plugin.version,
                    latestVersion: await latestVersion("@protokol/nameservice-crypto"),
                    defaults: CryptoDefaults,
                },
            });
        });
    });
});
