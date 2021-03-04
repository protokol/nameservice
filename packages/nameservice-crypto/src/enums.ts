import { defaults } from "./defaults";

export enum NameServiceTransactionTypes {
    Nameservice = 0,
}

export const NameServiceTransactionGroup = defaults.nameserviceTypeGroup;

// parse to string
const nameserviceStaticFee: any = defaults.nameserviceStaticFee.toString();

export enum NameServiceStaticFees {
    Nameservice = nameserviceStaticFee,
}

export const NameServiceTransactionVersion = defaults.version;
