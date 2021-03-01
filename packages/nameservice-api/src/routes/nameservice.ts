import { Schemas } from "@arkecosystem/core-api";
import Hapi from "@hapi/hapi";
import Joi from "joi";

import { NameserviceController } from "../controllers/nameservice";

export const register = (server: Hapi.Server): void => {
    const controller = server.app.app.resolve(NameserviceController);
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/",
        handler: controller.all,
        options: {
            validate: {
                query: Joi.object({
                    orderBy: server.app.schemas.orderBy,
                    transform: Joi.bool().default(true),
                }).concat(Schemas.pagination),
            },
            plugins: {
                pagination: {
                    enabled: true,
                },
            },
        },
    });

    server.route({
        method: "GET",
        path: "/{id}",
        handler: controller.show,
        options: {
            validate: {
                query: Joi.object({
                    transform: Joi.bool().default(true),
                }),
                params: Joi.object({
                    id: Joi.string().hex().length(64),
                }),
            },
        },
    });

    server.route({
        method: "GET",
        path: "/{id}/wallet",
        handler: controller.wallet,
        options: {
            validate: {
                params: Joi.object({
                    id: Joi.string().hex().length(64),
                }),
            },
        },
    });
};
