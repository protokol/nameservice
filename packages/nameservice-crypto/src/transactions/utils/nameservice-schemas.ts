export const amountSchema = { bignumber: { minimum: 0, maximum: 0 } };

export const vendorFieldSchema = { anyOf: [{ type: "null" }, { type: "string", format: "vendorField" }] };

export const nameserviceSchema = {
    type: "object",
    required: ["name"],
    properties: {
        name: {
            type: "string",
            minLength: 1,
            maxLength: 90,
            pattern: "^[a-zA-Z0-9]+(( - |[ ._-])[a-zA-Z0-9]+)*[.]?$",
        },
    },
};
