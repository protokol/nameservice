import { Controller } from "@arkecosystem/core-api";
import { Container } from "@arkecosystem/core-kernel";
import Hapi from "@hapi/hapi";
import { Defaults as CryptoDefaults } from "@protokol/nameservice-crypto";
import { Defaults as TransactionDefaults } from "@protokol/nameservice-transactions";
import latestVersion from "latest-version";

import { defaults as ApiDefaults } from "../defaults";
import { ConfigurationResource } from "../resources/configurations";

const packageName = require("../../package.json").name;
const currentVersion = require("../../package.json").version;

@Container.injectable()
export class ConfigurationController extends Controller {
    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<any> {
        const apiLatestVersion = await latestVersion(packageName);
        const cryptoLatestVersion = await latestVersion("@protokol/nameservice-crypto");
        const transactionsLatestVersion = await latestVersion("@protokol/nameservice-transactions");

        return this.respondWithResource(
            {
                apiPackageName: packageName,
                apiLatestVersion,
                cryptoLatestVersion,
                transactionsLatestVersion,
                currentVersion: currentVersion,
                transactionsDefaults: TransactionDefaults,
                cryptoDefaults: CryptoDefaults,
                apiDefaults: ApiDefaults,
            },
            ConfigurationResource,
        );
    }
}
