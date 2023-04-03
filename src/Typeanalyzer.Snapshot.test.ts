import { describe, it, expect } from 'vitest';
import {Typeanalyzer} from "./Typeanalyzer";
import {Formatter, KotlinFormat, TypescriptFormat} from "./Formatter";


interface RootObject {
    id?: string;
    nullValue?: string | null;
    active?: boolean;
    count?: number;
    countLong?: number;
    fraction?: number;
    fractionFloat?: number;
    emptyArray?: Array<Stuff | null | undefined>;
    listOfStuff?: Array<Stuff | null | undefined>;
}

interface Stuff {
    id?: string;
    meta?: { [key: string]: string | undefined | null };
}


const valueObject: RootObject = {
    id: "id",
    nullValue: null,
    active: true,
    count: 123,
    countLong: 1231231,
    fraction: 0.3,
    fractionFloat: 0.333,
    emptyArray: [],
    listOfStuff: [
        {
            id: 'random long string',
            meta: {
                key: "value",
                key2: "other"
            }
        }
    ]
};

describe('Typeanalyzer Snapshot', () => {
    it('should be able to create simple analysis', () => {
        const analyzer = new Typeanalyzer();
        const capture = analyzer.capture(valueObject);

        expect(analyzer.report()).toEqual(capture);
        expect(capture).toMatchSnapshot();
    });

    it('should reconcile nullability of preexisting fields', () => {
        const analyzer = new Typeanalyzer();
        const captures = [
            analyzer.capture(valueObject),
            analyzer.capture({}),
            analyzer.capture(null),
            analyzer.capture(undefined),
            analyzer.capture({ ...valueObject, listOfStuff: [
                    { id: null, meta: { key: null, key2: null }},
                    null,
                    { id: null, meta: null},
            ]})
        ];

        expect(analyzer.report()).not.toEqual(captures[0]);
        expect(analyzer.report()).toEqual(captures[captures.length - 1]);
        for (const capture of captures) {
            expect(capture).toMatchSnapshot();
        }
    });

    it('should update all nullability fields of lists', () => {
        const analyzer = new Typeanalyzer();
        const captures = [
            analyzer.capture({ list: [] }),
            analyzer.capture({ list: ["content"] }),
            analyzer.capture({ list: ["content", null, "more"] }),
            analyzer.capture({ list: null }),
            analyzer.capture(null),
        ];

        expect(analyzer.report()).not.toEqual(captures[0]);
        expect(analyzer.report()).toEqual(captures[captures.length - 1]);
        for (const capture of captures) {
            expect(capture).toMatchSnapshot();
        }
    });

    it('should make key mismatches into nullable elements', () => {
        const analyzer = new Typeanalyzer();
        const captures = [
            analyzer.capture({ key1: 'value' }),
            analyzer.capture({ key2: 'value' }),
        ];

        expect(analyzer.report()).not.toEqual(captures[0]);
        expect(analyzer.report()).toEqual(captures[captures.length - 1]);
        for (const capture of captures) {
            expect(capture).toMatchSnapshot();
        }
    });

    it('should override types even if types mismatch', () => {
        const analyzer = new Typeanalyzer();
        const captures = [
            analyzer.capture(valueObject),
            analyzer.capture({
                active: true,
                count: null,
                countLong: null,
                fraction: null,
            }),
        ];

        expect(analyzer.report()).not.toEqual(captures[0]);
        expect(analyzer.report()).toEqual(captures[captures.length - 1]);
        for (const capture of captures) {
            expect(capture).toMatchSnapshot();
        }
    });

    it('should not throw error', () => {
        const analyzer = new Typeanalyzer();
        analyzer.capture(valueObject);

        const capture = analyzer.capture("a primitive value");

        expect(capture).toMatchSnapshot();
    });

    it('should prettyprint output', () => {
        const analyzer = new Typeanalyzer();
        const capture = analyzer.capture(valueObject);

        expect(new Formatter(new TypescriptFormat()).print(capture)).toMatchSnapshot();
        expect(new Formatter(new KotlinFormat()).print(capture)).toMatchSnapshot();
    });
});