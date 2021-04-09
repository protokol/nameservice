import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";

import { NameserviceTransactionHandler } from "./handlers";
import { namespaceWalletIndex, namespaceWalletIndexer } from "./wallet-indexes";

const plugin = require("../package.json");

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        const logger: Contracts.Kernel.Logger = this.app.get(Container.Identifiers.LogService);
        logger.info(`Loading plugin: ${plugin.name} with version ${plugin.version}.`);

        this.registerIndexers();

        this.app.bind(Container.Identifiers.TransactionHandler).to(NameserviceTransactionHandler);
    }

    private registerIndexers() {
        this.app
            .bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex)
            .toConstantValue({ name: namespaceWalletIndex, indexer: namespaceWalletIndexer, autoIndex: false });
    }
}
