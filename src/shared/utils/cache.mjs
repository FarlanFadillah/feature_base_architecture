import NodeCache from "node-cache";
import CreateDebug from "debug";
const debug = CreateDebug("app:utils:cache");

const cache = new NodeCache({
    deleteOnExpire: true,
    stdTTL: 60 * 10, // 10 minutes
    checkperiod: 10, // check period every 5 minutes
    useClones: false,
});

cache.on("expired", (key, value) => {
    debug(`Cache ${key} is expired`);
});

cache.on("del", (key, value) => {
    debug(`Cache ${key} is deleted`);
});

cache.on("set", (key, value) => {
    debug(`Cache ${key} is set`);
});

export function set(key, value, statusCode = 200) {
    debug(`set ${key} with status code ${statusCode}`);
    if (statusCode >= 400) cache.set(key, value, 10);
    else cache.set(key, value);
}

export function get(key) {
    return cache.get(key);
}

/**
 *
 * @param {String} str
 * @example delByPattern(":users:id:1:")
 * Use colons at the beginning and end of names, and for separators.
 */
export function delByPattern(str) {
    for (const key of cache.keys()) {
        if (key.includes(str)) {
            cache.del(key);
            console.log(`Deleting ${key}`);
        }
    }
}
