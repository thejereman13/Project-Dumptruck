export class ObjectCache<T extends { id: string }> {
    infoStoreLength: number;
    infoStoreID: string;

    constructor(id: string, maxLength = 512) {
        this.infoStoreLength = maxLength;
        this.infoStoreID = id;
    }

    infoStore: Record<string, T> | null = null;
    infoStoreLRU: string[] = [];

    private getStore(): Record<string, T> {
        if (this.infoStore === null) {
            const str = localStorage[this.infoStoreID];
            if (str) this.infoStore = JSON.parse(str) ?? {};
            else this.infoStore = {};
            const lruStr = localStorage[this.infoStoreID + "-lru"];
            if (lruStr) this.infoStoreLRU = JSON.parse(lruStr) ?? [];
            else this.infoStoreLRU = [];
            if (Object.keys(this.infoStore ?? {}).length > this.infoStoreLRU.length) {
                this.infoStoreLRU = Object.keys(this.infoStore ?? {});
            }
        }
        return this.infoStore ?? {};
    }
    private saveStore(store: Record<string, T>): void {
        this.infoStore = store;
        localStorage[this.infoStoreID] = JSON.stringify(this.infoStore);
        this.saveLRU();
    }
    private saveLRU(): void {
        localStorage[this.infoStoreID + "-lru"] = JSON.stringify(this.infoStoreLRU);
    }

    public pushInfoStore(videoInfo: T): T {
        const infoStore = this.getStore();
        if (infoStore[videoInfo.id]) return videoInfo;
        infoStore[videoInfo.id] = videoInfo;
        this.pushLRU(videoInfo.id);
        this.saveStore(infoStore);
        return videoInfo;
    }
    private pushLRU(id: string): void {
        if (!this.infoStore) return;
        // LRU is backwards in memory, newest members are at the end of the array
        const ind = this.infoStoreLRU.indexOf(id);
        if (ind >= 0) {
            this.infoStoreLRU.splice(ind, 1);
        }
        this.infoStoreLRU.push(id);
        if (this.infoStoreLRU.length > this.infoStoreLength) {
            const rem = this.infoStoreLRU.splice(0, 1);
            delete this.infoStore[rem[0]];
            this.saveStore(this.infoStore);
        } else {
            this.saveLRU();
        }
    }

    public queryInfoStore(id: string): T | null {
        const infoStore = this.getStore();
        const elem = infoStore[id];
        if (elem) {
            this.pushLRU(elem.id);
            return elem;
        }
        return null;
    }
}

export class LRUList<T> {
    infoStoreID: string;

    constructor(id: string) {
        this.infoStoreID = id;
    }

    infoStoreLRU: T[] = [];

    private saveLRU(): void {
        localStorage[this.infoStoreID] = JSON.stringify(this.infoStoreLRU);
    }

    public pushItem(id: T): void {
        // LRU is backwards in memory, newest members are at the end of the array
        const ind = this.infoStoreLRU.indexOf(id);
        if (ind > 0) {
            this.infoStoreLRU.splice(ind, 1);
        }
        if (ind !== 0) {
            this.infoStoreLRU.unshift(id);
            this.saveLRU();
        }
    }

    public getList(): T[] {
        if (this.infoStoreLRU.length == 0) {
            const lruStr = localStorage[this.infoStoreID];
            if (lruStr) this.infoStoreLRU = JSON.parse(lruStr) ?? [];
            else this.infoStoreLRU = [];
        }
        return this.infoStoreLRU;
    }
}