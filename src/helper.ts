export class Helper {
    constructor() {

    }

    static findIndexAll(arr: string[], val: string) {

        var indexes = [], i;
        for (i = 0; i < arr.length; i++)
            if (arr[i].indexOf(val) > -1)
                indexes.push(i);
        return indexes;
    }

}