import { describe, it, expect } from 'vitest';
import {intersection, minus} from "./SetUtils";

describe('SetUtils.intersection', () => {
    it('should return common elements', () => {
        const result = intersection(new Set([1, 2, 3]), new Set([2, 4, 6]));
        expect(result).to.contain(2);
    });

    it('should not change original sets', () => {
        const setA = new Set([1, 2, 3]);
        const setB = new Set([2, 4, 6]);

        intersection(setA, setB);

        expect(setA).to.have.length(3);
        expect(setB).to.have.length(3);
    });

    it('should return empty set if there is no overlay', () => {
        const result = intersection(new Set([1, 2, 3]), new Set([4, 6]));
        expect(result).to.be.empty;
    });

    it('should handle empty sets', () => {
        expect(intersection(new Set([1, 2, 3]), new Set())).to.be.empty;
        expect(intersection(new Set(), new Set([1, 2, 3]))).to.be.empty;
    });
});

describe('SetUtils.minus', () => {
    it('should remove elements from first array', () => {
        const result = minus(new Set([1, 2, 3]), new Set([2, 4, 6]));

        expect(result).to.contain(1);
        expect(result).to.contain(3);
    });

    it('should not change original sets', () => {
        const setA = new Set([1, 2, 3]);
        const setB = new Set([2, 4, 6]);

        minus(setA, setB);

        expect(setA).to.have.length(3);
        expect(setB).to.have.length(3);
    });
});