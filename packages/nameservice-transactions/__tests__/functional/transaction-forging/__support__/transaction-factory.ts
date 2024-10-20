import { Contracts } from "@arkecosystem/core-kernel";
import { TransactionFactory } from "@arkecosystem/core-test-framework";
import { Builders, Interfaces } from "@protokol/nameservice-crypto";

export class NamespaceTransactionFactory extends TransactionFactory {
    protected constructor(app?: Contracts.Kernel.Application) {
        super(app);
    }

    public static override initialize(app?: Contracts.Kernel.Application): NamespaceTransactionFactory {
        return new NamespaceTransactionFactory(app);
    }

    public Nameservice(nameservice: Interfaces.INameServiceAsset): NamespaceTransactionFactory {
        this.builder = new Builders.NameserviceBuilder().Nameservice(nameservice);

        return this;
    }
}
