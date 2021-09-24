import "@arkecosystem/core-test-framework/dist/matchers";

import { Repositories } from "@arkecosystem/core-database";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { ApiHelpers, passphrases } from "@arkecosystem/core-test-framework";
import { Identities } from "@arkecosystem/crypto";
import { Builders } from "@protokol/nameservice-crypto";

import { Indexers } from "../../../../nameservice-transactions";
import { setUp, tearDown } from "../__support__/setup";

jest.setTimeout(30000);

let app: Contracts.Kernel.Application;
let api: ApiHelpers;

beforeAll(async () => {
    app = await setUp();
    api = new ApiHelpers(app);
});

afterAll(async () => await tearDown());

describe("API - Nameservice", () => {
    describe("GET /", () => {
        it("should return all nameservice transactions", async () => {
            const actual = new Builders.NameserviceBuilder().Nameservice({ name: "zan" }).sign(passphrases[0]!).build();

            const transactionRepository = app.get<Repositories.TransactionRepository>(
                Container.Identifiers.DatabaseTransactionRepository,
            );

            jest.spyOn(transactionRepository, "listByExpression").mockResolvedValueOnce({
                // @ts-ignore
                results: [{ ...actual.data, serialized: actual.serialized }],
                totalCount: 1,
                meta: { totalCountIsEstimate: false },
            });
            const response = await api.request("GET", "nameservice", { transform: false });

            expect(response.data.data[0]!.id).toStrictEqual(actual.id);
        });
    });

    describe("GET /nameservice/{id}", () => {
        it("should return specific nameservice transaction by its id", async () => {
            const actual = new Builders.NameserviceBuilder().Nameservice({ name: "zan" }).sign(passphrases[0]!).build();

            const transactionRepository = app.get<Repositories.TransactionRepository>(
                Container.Identifiers.DatabaseTransactionRepository,
            );

            jest.spyOn(transactionRepository, "findManyByExpression").mockResolvedValueOnce([
                // @ts-ignore
                {
                    ...actual.data,
                    serialized: actual.serialized,
                },
            ]);

            const response = await api.request("GET", `nameservice/${actual.id}`);
            expect(response.data.data.id).toStrictEqual(actual.id);
        });
    });

    describe("GET /nameservice/{id}/wallet", () => {
        it("should return specific wallet by its name", async () => {
            const walletRepository = app.getTagged<Contracts.State.WalletRepository>(
                Container.Identifiers.WalletRepository,
                "state",
                "blockchain",
            );

            const wallet = walletRepository.findByAddress(Identities.Address.fromPassphrase(passphrases[0]!));

            wallet.setAttribute("nameservice", { name: "zan" });
            walletRepository.getIndex(Indexers.namespaceWalletIndex).index(wallet);

            const response = await api.request("GET", `nameservice/zan/wallet`);

            expect(response.data.data.name).toStrictEqual("zan");
        });
    });
});
