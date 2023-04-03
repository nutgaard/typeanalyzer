# Type analyzer

A port of a [similar library](https://github.com/navikt/modia-common-utils/tree/main/typeanalyzer) written in kotlin.

Useful in cases where you're not quite sure how a datastructure looks like, e.g whats nullable and whats not.

This library helps the investigation into what you can expect by capturing the structure, and generating examples classes for you.

**Usage:**

```typescript
import {Typeanalyzer} from "./Typeanalyzer";

const serviceAnalyzer = new Typeanalyzer();

function somemethod(): Map<string, unknown> {
    const data = service.getSomeData();
    serviceAnalyzer.capture(data);
    return data;
}
```

**NB:** You should not reuse an instance of `Typeanalyzer` for objects you expect to be different.

`Typeanalyzer` captures and maintains an inner representation of the datastructures it has captures, 
which fields that are nullable, and what their types should be (See the representation in the [snapshot](src/__snapshots__/Typeanalyzer.Snapshot.test.ts.snap)).

To get the representation programmatically you can call `serviceAnalyzer.report()`, which returns the most up-to-date representation.
This representation can be used to generate pseudo-code for kotlin and typescript:

```typescript
const typescriptCode = serviceAnalyzer.print(new TypescriptFormat());
const kotlinCode = serviceAnalyzer.print(new KotlinFormat());
```

**In-depth:**

The typeanalyzer works by capturing the structure of a given value, and gradually relaxing the constraints.

F.ex;
```typescript
const analyzer = new Typeanalyzer();
analyzer.capture(["value"]); // ListCapture[PrimitiveCapture[type = TEXT, nullable = false]]
analyzer.capture([null]);    // ListCapture[PrimitiveCapture[type = TEXT, nullable = true]]
```

If the typeanalyzer has not previously seen a valid type for a field, it tries to specify it if given the chance.

F.ex;
```typescript
const analyzer = new Typeanalyzer();
analyzer.capture([null]);     // ListCapture[NullCapture[]]
analyzer.capture(["value"]);  // ListCapture[PrimitiveCapture[type = TEXT, nullable = true]]
```

In the previous example the analyzer was initally passed `null` in the first capture, and the specified field was thus marked as `nullable`.
This is in contrast to if the analyzer has not yet seen any values in the list.

F.ex;
```typescript
const analyzer = new Typeanalyzer();
analyzer.capture([]);         // ListCapture[UnknownCapture[]]
analyzer.capture(["value"]);  // ListCapture[PrimitiveCapture[type = TEXT, nullable = false]]
analyzer.capture([null]);     // ListCapture[PrimitiveCapture[type = TEXT, nullable = true]]
```