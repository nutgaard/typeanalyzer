import {describe, expect, it} from "vitest";
import {Typeanalyzer} from "./Typeanalyzer";
import {Capture, ListCapture, NullCapture, ObjectCapture, PrimitiveCapture} from "./Capture";
import {CaptureType} from "./CaptureType";

describe('Typeanalyzer', () => {
    it('should be able to handle primitive values', () => {
        expect(new Typeanalyzer().capture(null)).instanceof(NullCapture);

        expect(new Typeanalyzer().capture(1)).instanceof(PrimitiveCapture);
        expect(new Typeanalyzer().capture(1)).toHaveProperty('nullable', false);
        expect(new Typeanalyzer().capture(1)).toHaveProperty('type', CaptureType.INT);

        expect(new Typeanalyzer().capture(0.5)).instanceof(PrimitiveCapture);
        expect(new Typeanalyzer().capture(0.5)).toHaveProperty('nullable', false);
        expect(new Typeanalyzer().capture(0.5)).toHaveProperty('type', CaptureType.DOUBLE);

        expect(new Typeanalyzer().capture("text")).instanceof(PrimitiveCapture);
        expect(new Typeanalyzer().capture("text")).toHaveProperty('nullable', false);
        expect(new Typeanalyzer().capture("text")).toHaveProperty('type', CaptureType.TEXT);
    });

    it('should be able to handle list values', () => {
        const capture = new Typeanalyzer().capture(["value", "values"]);

        expectListNullability(capture, false, false);
        expect(capture).toHaveProperty('subtype.type', CaptureType.TEXT);
    });

    it('should be able to handle object values', () => {
        const capture = new Typeanalyzer().capture({key: ["values"]});

        expectObjectNullability(capture, false, false, false);
    });

    it('should relax nullability for primitives', () => {
        const analyzer = new Typeanalyzer();
        analyzer.capture(1);

        const capture = analyzer.capture(null);

        expect(capture).instanceof(PrimitiveCapture);
        expect(capture).toHaveProperty('type', CaptureType.INT);
        expect(capture).toHaveProperty('nullable', true);
    });

    it('should relax nullability for list', () => {
        const analyzer = new Typeanalyzer();
        analyzer.capture(["value", "values"]);

        let capture = analyzer.capture([null]);

        expect(capture).instanceof(ListCapture);
        expect(capture).toHaveProperty('nullable', false);
        expect(capture).toHaveProperty('subtype.type', CaptureType.TEXT);
        expect(capture).toHaveProperty('subtype.nullable', true);

        capture = analyzer.capture(null);

        expect(capture).instanceof(ListCapture);
        expect(capture).toHaveProperty('nullable', true);
        expect(capture).toHaveProperty('subtype.type', CaptureType.TEXT);
        expect(capture).toHaveProperty('subtype.nullable', true);
    });

    it('should relax nullability for objects', () => {
        const analyzer = new Typeanalyzer();
        analyzer.capture({key: ["values"]});

        let capture = analyzer.capture({key: [null]});
        expectObjectNullability(capture, false, false, true);

        capture = analyzer.capture({key: null});
        expectObjectNullability(capture, false, true, true);

        capture = analyzer.capture(null);
        expectObjectNullability(capture, true, true, true);
    });

    it('should specify type for null values', () => {
        const analyzer = new Typeanalyzer();

        const nullCapture = analyzer.capture(null);
        const textCapture = analyzer.capture("text");

        expect(nullCapture).instanceof(NullCapture);
        expect(textCapture).instanceof(PrimitiveCapture);
        expect(textCapture).toHaveProperty('type', CaptureType.TEXT);
    });

    it('should specify type in lists for null values', () => {
        const analyzer = new Typeanalyzer();

        const nullList = analyzer.capture([null]);
        const nonNullList = analyzer.capture(["content"]);

        expect(nullList).instanceof(ListCapture);
        expect(nullList).toHaveProperty('nullable', false);
        expect(nullList).toHaveProperty('subtype.type', CaptureType.NULL);

        expect(nonNullList).instanceof(ListCapture);
        expect(nonNullList).toHaveProperty('nullable', false);
        expect(nonNullList).toHaveProperty('subtype.type', CaptureType.TEXT);
        expect(nonNullList).toHaveProperty('subtype.nullable', true);
    });

    it('should specify types in lists for unknown values', () => {
        const analyzer = new Typeanalyzer();
        const emptyCapture = analyzer.capture([]);
        const nonEmptyCapture = analyzer.capture(["content"]);

        expect(emptyCapture).instanceof(ListCapture);
        expect(emptyCapture).toHaveProperty('nullable', false);
        expect(emptyCapture).toHaveProperty('subtype.type', CaptureType.UNKNOWN);

        expect(nonEmptyCapture).instanceof(ListCapture);
        expect(nonEmptyCapture).toHaveProperty('nullable', false);
        expect(nonEmptyCapture).toHaveProperty('subtype.type', CaptureType.TEXT);
        expect(nonEmptyCapture).toHaveProperty('subtype.nullable', false);
    });

    it('should ignore unknown types when list is already types', () => {
        const analyzer = new Typeanalyzer();
        const nonEmptyCapture = analyzer.capture(["content"]);
        const emptyCapture = analyzer.capture([]);

        expect(nonEmptyCapture).instanceof(ListCapture);
        expect(nonEmptyCapture).toHaveProperty('nullable', false);
        expect(nonEmptyCapture).toHaveProperty('subtype.type', CaptureType.TEXT);
        expect(nonEmptyCapture).toHaveProperty('subtype.nullable', false);

        expect(emptyCapture).instanceof(ListCapture);
        expect(nonEmptyCapture).toHaveProperty('nullable', false);
        expect(nonEmptyCapture).toHaveProperty('subtype.type', CaptureType.TEXT);
        expect(nonEmptyCapture).toHaveProperty('subtype.nullable', false);
    });

    it('should specify types in objects for null values', () => {
        const analyzer = new Typeanalyzer();
        const nullMapCapture = analyzer.capture({key: null});
        const nonNullMapCapture = analyzer.capture({key: "content"});

        expect(nullMapCapture).instanceof(ObjectCapture);
        expect((nullMapCapture as ObjectCapture).fields.get("key")).instanceof(NullCapture);


        expect(nonNullMapCapture).instanceof(ObjectCapture);
        expect((nonNullMapCapture as ObjectCapture).fields.get("key")).instanceof(PrimitiveCapture);
        expect((nonNullMapCapture as ObjectCapture).fields.get("key")).toHaveProperty('type', CaptureType.TEXT);
        expect((nonNullMapCapture as ObjectCapture).fields.get("key")).toHaveProperty('nullable', true);
    });

    it('should specify type in objects for unknown values', () => {
        const analyzer = new Typeanalyzer();
        const nullMapCapture = analyzer.capture({});
        const nonNullMapCapture = analyzer.capture({key: "content"});

        expect(nullMapCapture).instanceof(ObjectCapture);
        expect((nullMapCapture as ObjectCapture).fields.size).toEqual(0);


        expect(nonNullMapCapture).instanceof(ObjectCapture);
        expect((nonNullMapCapture as ObjectCapture).fields.get("key")).instanceof(PrimitiveCapture);
        expect((nonNullMapCapture as ObjectCapture).fields.get("key")).toHaveProperty('type', CaptureType.TEXT);
        expect((nonNullMapCapture as ObjectCapture).fields.get("key")).toHaveProperty('nullable', true);
    });

    it('should ignore unknonwn types when object is already types', () => {
        const analyzer = new Typeanalyzer();
        const nonNullMapCapture = analyzer.capture({key: "content"});
        const nullMapCapture = analyzer.capture({});

        expect(nonNullMapCapture).instanceof(ObjectCapture);
        expect((nonNullMapCapture as ObjectCapture).fields.get("key")).instanceof(PrimitiveCapture);
        expect((nonNullMapCapture as ObjectCapture).fields.get("key")).toHaveProperty('type', CaptureType.TEXT);
        expect((nonNullMapCapture as ObjectCapture).fields.get("key")).toHaveProperty('nullable', false);

        expect(nullMapCapture).instanceof(ObjectCapture);
        expect((nullMapCapture as ObjectCapture).fields.get("key")).instanceof(PrimitiveCapture);
        expect((nullMapCapture as ObjectCapture).fields.get("key")).toHaveProperty('type', CaptureType.TEXT);
        expect((nullMapCapture as ObjectCapture).fields.get("key")).toHaveProperty('nullable', true);
    });

    it('should relax nullability when map updates', () => {
        const analyzer = new Typeanalyzer();
        const firstkeyCapture = analyzer.capture({key1: 'content'});
        const secondkeyCapture = analyzer.capture({key2: 'content'});

        expect(firstkeyCapture).instanceof(ObjectCapture);
        expect((firstkeyCapture as ObjectCapture).fields.get("key1")).instanceof(PrimitiveCapture);
        expect((firstkeyCapture as ObjectCapture).fields.get("key1")).toHaveProperty('type', CaptureType.TEXT);
        expect((firstkeyCapture as ObjectCapture).fields.get("key1")).toHaveProperty('nullable', false);
        expect((firstkeyCapture as ObjectCapture).fields.get("key2")).undefined;

        expect(secondkeyCapture).instanceof(ObjectCapture);
        expect((secondkeyCapture as ObjectCapture).fields.get("key1")).instanceof(PrimitiveCapture);
        expect((secondkeyCapture as ObjectCapture).fields.get("key1")).toHaveProperty('type', CaptureType.TEXT);
        expect((secondkeyCapture as ObjectCapture).fields.get("key1")).toHaveProperty('nullable', true);
        expect((secondkeyCapture as ObjectCapture).fields.get("key2")).instanceof(PrimitiveCapture);
        expect((secondkeyCapture as ObjectCapture).fields.get("key2")).toHaveProperty('type', CaptureType.TEXT);
        expect((secondkeyCapture as ObjectCapture).fields.get("key2")).toHaveProperty('nullable', true);
    });
});

function expectListNullability(capture: Capture | null, listNullable: boolean, listElementNullable: boolean) {
    expect(capture).instanceof(ListCapture);
    expect(capture).toHaveProperty('nullable', listNullable);
    expect(capture).toHaveProperty('subtype.nullable', listElementNullable);
}

function expectObjectNullability(capture: Capture | null, objectNullable: boolean, listNullable: boolean, listElementNullable: boolean) {
    expect(capture).instanceof(ObjectCapture);
    expect(capture).toHaveProperty('nullable', objectNullable)

    const listCapture = (capture as ObjectCapture).fields.get("key");
    expect(listCapture).instanceof(ListCapture);
    expect(listCapture).toHaveProperty('nullable', listNullable);

    const subtypeCapture = (listCapture as ListCapture).subtype;
    expect(subtypeCapture).instanceof(PrimitiveCapture);
    expect(subtypeCapture).toHaveProperty('nullable', listElementNullable);
}