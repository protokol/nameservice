import Hapi from "@hapi/hapi";

import * as Nameservice from "./routes/nameservice";
import * as Configurations from "./routes/configurations";

export const Handler = {
    async register(server: Hapi.Server): Promise<void> {
        Configurations.register(server);
        Nameservice.register(server);
    },
    name: "Nameservice Api",
    version: "1.0.0",
};
