import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";

import { NameserviceTransactionHandler } from "./handlers";
import { namespaceWalletIndex, namespaceWalletIndexer } from "./wallet-indexes";

const pluginName = require("../package.json").name;

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.registerIndexers();

        this.app.bind(Container.Identifiers.TransactionHandler).to(NameserviceTransactionHandler);
    }

    private registerIndexers() {
        this.app
            .bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex)
            .toConstantValue({ name: namespaceWalletIndex, indexer: namespaceWalletIndexer, autoIndex: false });
    }
}
