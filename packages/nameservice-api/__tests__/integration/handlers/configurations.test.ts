import "@arkecosystem/core-test-framework/dist/matchers";

import { Contracts } from "@arkecosystem/core-kernel";
import { ApiHelpers } from "@arkecosystem/core-test-framework";
import latestVersion from "latest-version";

import { setUp, tearDown } from "../__support__/setup";

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

            expect(response.data.data.package.name).toStrictEqual(plugin.name);
            expect(response.data.data.package.currentVersion).toStrictEqual(plugin.version);
            expect(response.data.data.package.latestVersion).toStrictEqual(await latestVersion(plugin.name));
            expect(response.data.data.crypto).toBeObject();
            expect(response.data.data.transactions).toBeObject();
        });
    });
});
