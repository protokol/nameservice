import Hapi from "@hapi/hapi";

import * as Nameservice from "./routes/nameservice";

export const Handler = {
    async register(server: Hapi.Server): Promise<void> {
        Nameservice.register(server);
    },
    name: "Nameservice Api",
    version: "1.0.0",
};
