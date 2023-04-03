import { describe, it, expect } from 'vitest';
import {CaptureStats} from "./CaptureStats";

describe('CaptureStats', () => {
    it('should record changes', () => {
        const stats = new CaptureStats();

        stats.capture(false);
        expect(stats.count).toEqual(1);
        expect(stats.countSizeLastChange).toEqual(1);

        stats.capture(false);
        expect(stats.count).toEqual(2);
        expect(stats.countSizeLastChange).toEqual(2);

        stats.capture(true);
        expect(stats.count).toEqual(3);
        expect(stats.countSizeLastChange).toEqual(0);
    });

    it('should record errors', () => {
        const stats = new CaptureStats();
        stats.error(new Error("first"));
        stats.error(new Error("second"));
        stats.error(new Error("third"));

        expect(stats.errors).toEqual(3);
        expect(stats.lastError?.message).toEqual("third");
    });

    it('should record confidence', () => {
        const stats = new CaptureStats();
        repeat(3, () => stats.capture(false));
        expect(stats.confidence).toEqual(1);


        stats.capture(true);
        expect(stats.confidence).toEqual(0);

        repeat(30, () => stats.capture(false));
        expect(stats.confidence).toBeCloseTo(0.88);
    });
});

function repeat(n: number, fn: () => void) {
    for (let i = 0; i < n; i++) {
        fn();
    }
}