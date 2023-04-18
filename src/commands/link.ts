import { Store } from "../database/store";
import { StoreData, TebexInformation } from "../types";
import { command } from "bdsx/command";
import * as Config from "../../config.json";
import { CommandPermissionLevel } from "bdsx/bds/command";
import { CxxString } from "bdsx/nativetype";
import { RestClient } from "../api/Client";
import { AxiosError } from "axios";
import { Sweep } from "../sweep";

const LinkConfig = Config.commands.link;

export function init(store: Store<StoreData>, sweep: Sweep): void {
    command.register(LinkConfig.name, LinkConfig.meta, CommandPermissionLevel.Admin).overload(
        (p, e, o) => {
            // Make Request To Get Store Info To Ensure Correct Token

            new RestClient(p[LinkConfig.params.secret]).api.information
                .get<TebexInformation>()
                .then(r => {
                    console.log(`[plugin:Tebexio]`, `Successfully changed token`.grey, "::".white, `${r.data.account.name} - ${r.data.account.domain}`.grey);

                    store.set("tebex_secret", p[LinkConfig.params.secret]).save();

                    sweep.start();
                })
                .catch((err: AxiosError) => {
                    console.error(
                        `[plugin:Tebexio]`,
                        `Failed to change token`.grey,
                        "::".white,
                        `(${err.response?.status}) - ${err.response?.statusText}`.red,
                        "-".white,
                        `${(err.response?.data as any)?.error_message ?? "Unknown Reason"}`.grey,
                    );
                });
        },
        {
            [LinkConfig.params.secret]: CxxString,
        },
    );
}
