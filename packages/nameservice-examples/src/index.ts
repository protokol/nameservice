import { Identities, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { ProtokolConnection } from "@protokol/client";
import { Builders, Transactions as NameserviceTransactions } from "@protokol/nameservice-crypto";

export const Nameservice = async (): Promise<void> => {
    // Configure our API client
    const client = new ProtokolConnection("http://localhost:4003/api");
    const passphrase = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";

    // Configure manager and register transaction type
    const configs = await client.api("node").crypto();
    const {
        body: {
            data: {
                block: { height },
            },
        },
    } = await client.get("blockchain");

    Managers.configManager.setConfig({ ...configs.body.data } as any);
    Managers.configManager.setHeight(height);
    Transactions.TransactionRegistry.registerTransactionType(NameserviceTransactions.NameserviceTransaction);

    // Step 1: Retrieve the nonce of the sender wallet
    const senderWallet = await client.api("wallets").get(Identities.Address.fromPassphrase(passphrase));
    const senderNonce = Utils.BigNumber.make(senderWallet.body.data.nonce).plus(1);

    // Step 2: Create the transaction
    const transaction = new Builders.NameserviceBuilder()
        .Nameservice({
            name: "zan",
        })
        .nonce(senderNonce.toFixed())
        .sign(passphrase);

    // Step 3: Broadcast the transaction
    const broadcastResponse = await client.api("transactions").create({ transactions: [transaction.build().toJson()] });

    // Step 4: Log the response
    console.log(JSON.stringify(broadcastResponse.body, null, 4));
};

Nameservice()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
