import { Container, Contracts, Providers, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import {
    Interfaces as NameserviceInterfaces,
    Transactions as NameserviceTransactions,
} from "@protokol/nameservice-crypto";

import { FeeType } from "../enums";
import { NameSpaceAlreadyExistsError, StaticFeeMismatchError, WalletHasNameSpaceError } from "../errors";
import { NamespaceApplicationEvents } from "../events";
import { namespaceWalletIndex } from "../wallet-indexes";

const pluginName = require("../../package.json").name;

export class NameserviceTransactionHandler extends Handlers.TransactionHandler {
    @Container.inject(Container.Identifiers.TransactionHistoryService)
    protected readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

    @Container.inject(Container.Identifiers.TransactionPoolQuery)
    protected readonly poolQuery!: Contracts.TransactionPool.Query;

    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", pluginName)
    protected readonly configuration!: Providers.PluginConfiguration;

    public async isActivated(): Promise<boolean> {
        return Managers.configManager.getMilestone().aip11 === true;
    }

    public getConstructor(): Transactions.TransactionConstructor {
        return NameserviceTransactions.NameserviceTransaction;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return ["nameservice", "nameservice.name"];
    }

    public dynamicFee({
        addonBytes,
        satoshiPerByte,
        transaction,
        height,
    }: Contracts.Shared.DynamicFeeContext): Utils.BigNumber {
        const feeType = this.configuration.get<FeeType>("feeType");

        if (feeType === FeeType.Static) {
            return this.getConstructor().staticFee({ height });
        }
        if (feeType === FeeType.None) {
            return Utils.BigNumber.ZERO;
        }

        return super.dynamicFee({ addonBytes, satoshiPerByte, transaction, height });
    }

    public async bootstrap(): Promise<void> {
        for await (const transaction of this.transactionHistoryService.streamByCriteria(this.getDefaultCriteria())) {
            AppUtils.assert.defined<string>(transaction.senderPublicKey);
            AppUtils.assert.defined<NameserviceInterfaces.INameServiceAsset>(transaction.asset?.nameservice);

            const wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);

            const nameserviceAsset: NameserviceInterfaces.INameServiceAsset = transaction.asset.nameservice;

            wallet.setAttribute<NameserviceInterfaces.INameServiceAsset>("nameservice", nameserviceAsset);

            this.walletRepository.getIndex(namespaceWalletIndex).set(nameserviceAsset.name, wallet);
        }
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.EventDispatcher): void {
        void emitter.dispatch(NamespaceApplicationEvents.Namespace, transaction.data);
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.Wallet,
    ): Promise<void> {
        const feeType = this.configuration.get<FeeType>("feeType");

        if (feeType === FeeType.Static) {
            const staticFee = this.getConstructor().staticFee();

            if (!transaction.data.fee.isEqualTo(staticFee)) {
                throw new StaticFeeMismatchError(staticFee.toFixed());
            }
        }
        AppUtils.assert.defined<NameserviceInterfaces.INameServiceAsset>(transaction.data.asset?.nameservice);

        const hasName = this.walletRepository
            .getIndex(namespaceWalletIndex)
            .has(transaction.data.asset.nameservice.name);
        // Name already registered
        if (hasName) {
            throw new NameSpaceAlreadyExistsError();
        }

        // Wallet already has name
        if (wallet.hasAttribute("nameservice")) {
            throw new WalletHasNameSpaceError();
        }

        return super.throwIfCannotBeApplied(transaction, wallet);
    }

    public async applyToSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.applyToSender(transaction);

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        AppUtils.assert.defined<NameserviceInterfaces.INameServiceAsset>(transaction.data.asset?.nameservice);

        const wallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const nameserviceAsset: NameserviceInterfaces.INameServiceAsset = transaction.data.asset.nameservice;

        wallet.setAttribute<NameserviceInterfaces.INameServiceAsset>("nameservice", nameserviceAsset);

        this.walletRepository.getIndex(namespaceWalletIndex).set(nameserviceAsset.name, wallet);
    }

    public async revertForSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.revertForSender(transaction);
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);
        AppUtils.assert.defined<NameserviceInterfaces.INameServiceAsset>(transaction.data.asset?.nameservice);

        const nameserviceAsset: NameserviceInterfaces.INameServiceAsset = transaction.data.asset.nameservice;

        const senderWallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        senderWallet.forgetAttribute("nameservice");

        this.walletRepository.getIndex(namespaceWalletIndex).forget(nameserviceAsset.name);
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public async applyToRecipient(transaction: Interfaces.ITransaction): Promise<void> {}

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public async revertForRecipient(transaction: Interfaces.ITransaction): Promise<void> {}

    protected getDefaultCriteria(): { typeGroup: number | undefined; type: number | undefined } {
        return {
            typeGroup: this.getConstructor().typeGroup,
            type: this.getConstructor().type,
        };
    }
}
