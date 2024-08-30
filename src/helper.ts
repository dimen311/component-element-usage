export class Helper {
    constructor() {

    }

    static findIndexAll(arr: string[], val: string) {

        var indexes = [], i;
        for (i = 0; i < arr.length; i++)
            if (arr[i] === val)
                indexes.push(i);
        return indexes;
    }


    // Example usage:
    //   const text = "Hello world, hello everyone. Hello world!";
    //   const substring = "Hello";
    //   const allIndexes = findIndexAll(text, substring);
    //   console.log(allIndexes); // Output: [0, 21]

}