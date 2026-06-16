import bcrypt from "bcrypt";
import { ExpressError } from "./custom.error.mjs";

export function hashing(password) {
    return new Promise((resolve, reject) => {
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) reject(new ExpressError(err.message));
            else resolve(hash);
        });
    });
}

export function compareHash(password, hash) {
    return new Promise((resolve, reject) => {
        bcrypt.compare(password, hash, (err, same) => {
            if (err) reject(new ExpressError(err.message));
            else resolve(same);
        });
    });
}
