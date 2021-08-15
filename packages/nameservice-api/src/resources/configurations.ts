import { Contracts } from "@arkecosystem/core-api";
import { Container } from "@arkecosystem/core-kernel";

@Container.injectable()
export class ConfigurationResource implements Contracts.Resource {
    /**
     * Return the raw representation of the resource.
     *
     * @param {*} resource
     * @returns {object}
     * @memberof Resource
     */
    public raw(resource): object {
        return JSON.parse(JSON.stringify(resource));
    }

    /**
     * Return the transformed representation of the resource.
     *
     * @param {*} resource
     * @returns {object}
     * @memberof Resource
     */
    public transform(resource): object {
        return {
            api: {
                packageName: resource.apiPackageName,
                currentVersion: resource.currentVersion,
                latestVersion: resource.apiLatestVersion,
                defaults: resource.apiDefaults,
            },
            transactions: {
                packageName: "@protokol/nameservice-transactions",
                currentVersion: resource.currentVersion,
                latestVersion: resource.transactionsLatestVersion,
                defaults: resource.cryptoDefaults,
            },
            crypto: {
                packageName: "@protokol/nameservice-crypto",
                currentVersion: resource.currentVersion,
                latestVersion: resource.cryptoLatestVersion,
                defaults: resource.cryptoDefaults,
            },
        };
    }
}
