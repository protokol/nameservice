import { Contracts } from "@arkecosystem/core-api";
import { Container } from "@arkecosystem/core-kernel";

@Container.injectable()
export class WalletResource implements Contracts.Resource {
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
            address: resource.address,
            publicKey: resource.publicKey,
            balance: resource.balance!.toFixed(),
            nonce: resource.nonce!.toFixed(),
            name: resource.attributes.attributes.nameservice.name,
        };
    }
}
