import { Contracts } from "@arkecosystem/core-api";
import { Container, Contracts as CoreContracts, Utils as AppUtils } from "@arkecosystem/core-kernel";

@Container.injectable()
export class NameserviceResource implements Contracts.Resource {
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    protected readonly walletRepository!: CoreContracts.State.WalletRepository;
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
        AppUtils.assert.defined<string>(resource.senderPublicKey);

        const sender: string = this.walletRepository.findByPublicKey(resource.senderPublicKey).getAddress();

        return {
            id: resource.id,
            sender,
            senderPublicKey: resource.senderPublicKey,
            vendorField: resource.vendorField,
            nameservice: resource.asset.nameservice.name,
            timestamp:
                typeof resource.timestamp !== "undefined" ? AppUtils.formatTimestamp(resource.timestamp) : undefined,
        };
    }
}
