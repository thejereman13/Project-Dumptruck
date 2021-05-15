export class ArrayCache<T> {
    infoStoreLength: number;
    infoStoreID: string;

    constructor(id: string, maxLength = 512) {
        this.infoStoreLength = maxLength;
        this.infoStoreID = id;
    }

    infoStore: T[] | null = null;

    private getStore(): T[] {
        if (this.infoStore === null) {
            const str = localStorage[this.infoStoreID];
            if (str) this.infoStore = JSON.parse(str) ?? [];
            else this.infoStore = [];
        }
        return this.infoStore ?? [];
    }
    private saveStore(arr: T[]): void {
        this.infoStore = arr;
        localStorage[this.infoStoreID] = JSON.stringify(this.infoStore);
    }

    public pushInfoStore(videoInfo: T): T {
        let infoStore = this.getStore();
        if (infoStore.includes(videoInfo)) return videoInfo;
        if (infoStore.push(videoInfo) > this.infoStoreLength) {
            infoStore = infoStore.slice(1);
        }
        this.saveStore(infoStore);
        return videoInfo;
    }

    public queryInfoStore(filter: (e: T) => boolean): T | null {
        const infoStore = this.getStore();
        const ind = infoStore.findIndex(filter);
        if (ind >= 0) return infoStore[ind] ?? null;
        return null;
    }
}
