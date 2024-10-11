export class Helper {
    constructor() {

    }

    static findIndexAll(arr: string[], val: string) {
        let indexes = [];
        const regex = new RegExp(`^${val}(\\s|>)`);
    
        for (let i = 0; i < arr.length; i++) {
            if (regex.test(arr[i])) {
                indexes.push(i);
            }
        }
        return indexes;
    }

}