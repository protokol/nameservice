import "jest-extended";

import { Application, Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import { Generators, passphrases } from "@arkecosystem/core-test-framework";
import { Managers, Transactions } from "@arkecosystem/crypto";
import { Utils } from "@arkecosystem/crypto";
import Hapi from "@hapi/hapi";
import { Builders, Interfaces, Transactions as NameserviceTransactions } from "@protokol/nameservice-crypto";

import { NameserviceController } from "../../../src/controllers/nameservice";
import {
    blockHistoryService,
    buildWallet,
    ErrorResponse,
    initApp,
    ItemResponse,
    PaginatedResponse,
    transactionHistoryService,
} from "../__support__";

let app: Application;

let nameserviceController: NameserviceController;

const timestamp = AppUtils.formatTimestamp(104930456);

let senderWallet;
let walletRepository;

beforeEach(async () => {
    const config = Generators.generateCryptoConfigRaw();
    Managers.configManager.setConfig(config);

    app = initApp();

    walletRepository = app.get<Wallets.WalletRepository>(Container.Identifiers.WalletRepository);

    nameserviceController = app.resolve<NameserviceController>(NameserviceController);

    blockHistoryService.findOneByCriteria.mockReset();
    senderWallet = buildWallet(app, passphrases[0]!);
    walletRepository.index(senderWallet);
});

afterEach(() => {
    Transactions.TransactionRegistry.deregisterTransactionType(NameserviceTransactions.NameserviceTransaction);
});

describe("Test Nameservice Controller", () => {
    it("all - should return all", async () => {
        const actual = new Builders.NameserviceBuilder().Nameservice({ name: "zan" }).sign(passphrases[0]!).build();

        transactionHistoryService.listByCriteriaJoinBlock.mockResolvedValueOnce({
            results: [
                {
                    data: actual.data,
                    block: { timestamp: timestamp.epoch },
                },
            ],
        });

        const request: Hapi.Request = {
            query: {
                page: 1,
                limit: 100,
                transform: true,
            },
        };

        const response = await nameserviceController.all(request, undefined);

        expect(response.results[0]).toEqual(
            expect.objectContaining({
                id: actual.id,
            }),
        );
    });

    it("show - should return specific nameservic transaction", async () => {
        const actual = new Builders.NameserviceBuilder().Nameservice({ name: "zan" }).sign(passphrases[0]!).build();

        transactionHistoryService.findOneByCriteria.mockResolvedValueOnce(actual.data);
        blockHistoryService.findOneByCriteria.mockResolvedValueOnce({ timestamp: timestamp.epoch });

        const request: Hapi.Request = {
            query: {
                transform: true,
            },
            params: {
                id: actual.id,
            },
        };

        const response = await nameserviceController.show(request, undefined);

        expect(response.data.id).toStrictEqual(actual.data.id);
    });

    it("wallet - should return correct wallet by name", async () => {
        senderWallet.setAttribute("nameservice", { name: "zan" });
        walletRepository.index(senderWallet);

        const request: Hapi.Request = {
            params: {
                id: "zan",
            },
        };

        const response = await nameserviceController.wallet(request, undefined);

        expect(response.data.name).toStrictEqual("zan");
    });
});
