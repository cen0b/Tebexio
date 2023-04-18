import { Request } from "./Request";
import type { RequestOptions } from "../types";
import { requestCreator } from "./RequestBuilder";

export class RestClient {
    protected readonly token: string;
    public constructor(token: string) {
        if (!token) throw new Error("Missing Token!");
        this.token = token;
    }

    public get api() {
        return requestCreator(this);
    }

    public get auth(): { "X-Tebex-Secret": string } {
        return { "X-Tebex-Secret": this.token };
    }

    public async request(method: string, endpoint: string, options: RequestOptions = {}): Promise<unknown> {
        //@ts-ignore
        return new Request(this, method, endpoint, options).make();
    }
}
