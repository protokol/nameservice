import { Errors } from "@arkecosystem/core-transactions";

// Fee errors
export class StaticFeeMismatchError extends Errors.TransactionError {
    public constructor(staticFee: string) {
        super(`Failed to apply transaction, because fee doesn't match static fee ${staticFee}.`);
    }
}

// Name service errors

export class NameSpaceAlreadyExistsError extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because name space is already registered.`);
    }
}

export class WalletHasNameSpaceError extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because name already has name space.`);
    }
}
