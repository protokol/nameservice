import "jest-extended";

import { Application, Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import { passphrases } from "@arkecosystem/core-test-framework";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { Builders, Enums, Interfaces as NameserviceInterfaces } from "@protokol/nameservice-crypto";
import { Transactions as NameserviceTransactions } from "@protokol/nameservice-crypto";

import { FeeType } from "../../../src/enums";
import { NameSpaceAlreadyExistsError, StaticFeeMismatchError, WalletHasNameSpaceError } from "../../../src/errors";
import { NamespaceApplicationEvents } from "../../../src/events";
import { namespaceWalletIndex } from "../../../src/wallet-indexes";
import { buildWallet, initApp, transactionHistoryService } from "../__support__/app";

let app: Application;

let senderWallet: Contracts.State.Wallet;

let walletRepository: Wallets.WalletRepository;

let transactionHandlerRegistry: Handlers.Registry;

let handler: Handlers.TransactionHandler;

let actual: Interfaces.ITransaction;

beforeEach(() => {
    app = initApp();

    senderWallet = buildWallet(app, passphrases[0]!);

    walletRepository = app.get<Wallets.WalletRepository>(Container.Identifiers.WalletRepository);

    transactionHandlerRegistry = app.get<Handlers.Registry>(Container.Identifiers.TransactionHandlerRegistry);

    handler = transactionHandlerRegistry.getRegisteredHandlerByType(
        Transactions.InternalTransactionType.from(
            Enums.NameServiceTransactionTypes.Nameservice,
            Enums.NameServiceTransactionGroup,
        ),
        2,
    );
    walletRepository.index(senderWallet);

    actual = new Builders.NameserviceBuilder().Nameservice({ name: "zan" }).nonce("1").sign(passphrases[0]!).build();
});

afterEach(() => {
    Transactions.TransactionRegistry.deregisterTransactionType(NameserviceTransactions.NameserviceTransaction);
});

describe("Nameservice tests", () => {
    describe("bootstrap tests", () => {
        it("should test bootstrap method", async () => {
            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield actual.data;
            });

            await expect(handler.bootstrap()).toResolve();

            expect(walletRepository.findByIndex(namespaceWalletIndex, "zan")).toStrictEqual(senderWallet);
            expect(senderWallet.getAttribute("nameservice")).toStrictEqual({ name: "zan" });
        });
    });

    describe("throwIfCannotBeApplied tests", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(actual, senderWallet)).toResolve();
        });

        it("should throw if nameservice is undefined", async () => {
            const undefinedNameservice = { ...actual };
            undefinedNameservice.data.asset = undefined;

            await expect(handler.throwIfCannotBeApplied(undefinedNameservice, senderWallet)).toReject();
        });

        it("should throw StaticFeeMismatchError", async () => {
            app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set<FeeType>(
                "feeType",
                FeeType.Static,
            );

            actual = new Builders.NameserviceBuilder()
                .Nameservice({ name: "zan" })
                .nonce("1")
                .fee("1")
                .sign(passphrases[0]!)
                .build();

            await expect(handler.throwIfCannotBeApplied(actual, senderWallet)).rejects.toThrowError(
                StaticFeeMismatchError,
            );
        });

        it("should throw NameSpaceAlreadyExistsError", async () => {
            walletRepository.getIndex(namespaceWalletIndex).set("zan", senderWallet);

            await expect(handler.throwIfCannotBeApplied(actual, senderWallet)).rejects.toThrowError(
                NameSpaceAlreadyExistsError,
            );
        });

        it("should throw WalletHasNameSpaceError", async () => {
            senderWallet.setAttribute<NameserviceInterfaces.INameServiceAsset>("nameservice", { name: "zan" });

            await expect(handler.throwIfCannotBeApplied(actual, senderWallet)).rejects.toThrowError(
                WalletHasNameSpaceError,
            );
        });
    });

    describe("emitEvents", () => {
        it("should test dispatch", async () => {
            const emitter: Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(
                Container.Identifiers.EventDispatcherService,
            );

            const spy = jest.spyOn(emitter, "dispatch");

            handler.emitEvents(actual, emitter);

            expect(spy).toHaveBeenCalledWith(NamespaceApplicationEvents.Namespace, expect.anything());
        });
    });

    describe("apply tests", () => {
        it("should test apply method", async () => {
            await expect(handler.applyToSender(actual)).toResolve();

            expect(walletRepository.findByIndex(namespaceWalletIndex, "zan")).toStrictEqual(senderWallet);
            expect(senderWallet.getAttribute("nameservice")).toStrictEqual({ name: "zan" });
        });
    });

    describe("revert tests", () => {
        it("should test revert method", async () => {
            await handler.applyToSender(actual);

            await expect(handler.revertForSender(actual)).toResolve();

            expect(walletRepository.getIndex(namespaceWalletIndex).get("zan")).toBeUndefined();
            expect(senderWallet.hasAttribute("nameservice")).toBeFalsy();
        });
    });

    describe("fee tests", () => {
        it("should test dynamic fee", async () => {
            expect(
                handler.dynamicFee({
                    transaction: actual,
                    addonBytes: 150,
                    satoshiPerByte: 3,
                    height: 1,
                }),
            ).toEqual(Utils.BigNumber.make((Math.round(actual.serialized.length / 2) + 150) * 3));
        });

        it("should test static fee", async () => {
            app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set<FeeType>(
                "feeType",
                FeeType.Static,
            );

            expect(
                handler.dynamicFee({
                    transaction: actual,
                    addonBytes: 150,
                    satoshiPerByte: 3,
                    height: 1,
                }),
            ).toEqual(Utils.BigNumber.make(handler.getConstructor().staticFee()));
        });

        it("should test none fee", async () => {
            app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set<FeeType>(
                "feeType",
                FeeType.None,
            );
            expect(
                handler.dynamicFee({
                    transaction: actual,
                    addonBytes: 150,
                    satoshiPerByte: 3,
                    height: 1,
                }),
            ).toEqual(Utils.BigNumber.ZERO);
        });
    });

    describe("Test if handler is active", () => {
        it("should be activated", async () => {
            expect(await handler.isActivated()).toBeTruthy();
        });
    });
});
