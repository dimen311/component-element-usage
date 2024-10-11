import { Helper } from './helper';

describe('Helper', () => {
    describe('findIndexAll', () => {
        it('should return an empty array if the input array is empty', () => {
            const result = Helper.findIndexAll([], 'val');
            expect(result).toEqual([]);
        });

        it('should return an empty array if no element contains the value', () => {
            const result = Helper.findIndexAll(['a', 'b', 'c'], 'x');
            expect(result).toEqual([]);
        });

        it('should return an array with indexes of elements containing the value', () => {
            const result = Helper.findIndexAll(['<apple ', '<apple-gold ', '<apricot '], '<apple');
            expect(result).toEqual([0]);
        });

        it('should return correct indexes when multiple elements contain the value', () => {
            const result = Helper.findIndexAll(['cat ', '<hat> ', '<hat id="2" '], '<hat');
            expect(result).toEqual([1, 2]);
        });

        it('should return correct indexes when the value is found as a substring', () => {
            const result = Helper.findIndexAll(['<well ', '<well-hello ', '<wel '], '<well');
            expect(result).toEqual([0]);
        });
    });
});
