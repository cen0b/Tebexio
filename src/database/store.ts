import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";

export class Store<T extends Record<any, any>> {
    protected readonly aPath: string;
    protected readonly data: T;

    constructor(path: string) {
        this.aPath = resolve(__dirname, path);

        if (!existsSync(this.aPath)) {
            const directory = dirname(this.aPath);
            mkdirSync(directory, { recursive: true });
            writeFileSync(this.aPath, JSON.stringify({}));
        }

        this.data = JSON.parse(readFileSync(this.aPath, "utf8"));
    }

    public get<K extends keyof T>(key: K): T[K] {
        return this.data[key];
    }

    public set<K extends keyof T>(key: K, value: T[K]): this {
        this.data[key] = value;
        return this;
    }

    public update<K extends keyof T>(key: K, update: Partial<T[K]>): this {
        this.data[key] = { ...this.data[key], ...update };
        return this;
    }

    public delete<K extends keyof T>(key: K): this {
        delete this.data[key];
        return this;
    }

    public keys(): Array<keyof T> {
        return Object.keys(this.data) as Array<keyof T>;
    }

    public values(): T[keyof T][] {
        return Object.values(this.data);
    }

    public entries(): Array<[keyof T, T[keyof T]]> {
        return Object.entries(this.data) as Array<[keyof T, T[keyof T]]>;
    }

    public save(): this {
        writeFileSync(this.aPath, JSON.stringify(this.data));
        return this;
    }
}
