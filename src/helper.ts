export class Helper {
    constructor() {

    }

    static findIndexAll(arr: string[], val: string) {
        let indexes = [];
        const regex = new RegExp(`${val}(?:\\s+[^>]*)?(?:>|\/>\\s*|$)`,'g');    
        for (let i = 0; i < arr.length; i++) {
           if( arr[i].match(regex)){
            indexes.push(i);
           }
        }
        return indexes;
    }
}