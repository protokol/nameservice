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

        const sender: string = this.walletRepository.findByPublicKey(resource.senderPublicKey).address;

        return {
            id: resource.id,
            blockId: resource.blockId,
            version: resource.version,
            type: resource.type,
            typeGroup: resource.typeGroup,
            amount: resource.amount.toFixed(),
            fee: resource.fee.toFixed(),
            sender,
            senderPublicKey: resource.senderPublicKey,
            recipient: resource.recipientId || sender,
            signature: resource.signature,
            signSignature: resource.signSignature || resource.secondSignature,
            signatures: resource.signatures,
            vendorField: resource.vendorField,
            asset: resource.asset,
            timestamp:
                typeof resource.timestamp !== "undefined" ? AppUtils.formatTimestamp(resource.timestamp) : undefined,
            nonce: resource.nonce!.toFixed(),
        };
    }
}
