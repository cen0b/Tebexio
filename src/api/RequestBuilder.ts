// ES2015 introduced Proxy which allows for interception
// and definition of custom behavior for fundamental language operations
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Meta_programming
import type { RestClient } from "./Client";
import type { EndpointTree, RequestOptions } from "../types";

const noop = {};
const reflectors = ["toString", "stringify"];
const methods = ["get", "post", "delete", "patch", "put"];

/**
 * Request creator is a powerful function utilizing Javascripts
 * [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
 * introduced in ES2015!
 *
 * @param client RestClient
 * @returns Optional Methods
 */
export function requestCreator(client: RestClient): EndpointTree {
    const route: string[] = [""];
    const handler: ProxyHandler<EndpointTree> = {
        get(_: EndpointTree, target: string): unknown {
            if (reflectors.includes(target)) return () => route.join("/");
            if (methods.includes(target)) return (options: RequestOptions) => client.request(target, route.join("/"), options);
            route.push(target);

            return new Proxy(noop, handler) as EndpointTree;
        },
    };

    return new Proxy(noop, handler) as EndpointTree;
}
