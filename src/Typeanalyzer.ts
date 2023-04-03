import {Capture, ListCapture, NullCapture, ObjectCapture, PrimitiveCapture, UnknownCapture} from "./Capture";
import {CaptureStats} from "./CaptureStats";
import {CaptureType} from "./CaptureType";
import {Format, Formatter} from "./Formatter";

export class Typeanalyzer {
    #previousCapture: Capture | null = null;
    #stats: CaptureStats = new CaptureStats();

    public get stats(): CaptureStats {
        return this.#stats
    }

    capture(value: any | undefined | null): Capture {
        try {
            const json = JSON.stringify(value);
            const obj = JSON.parse(json);
            const capture: Capture = createCapture(obj);
            const reconciledCapture: Capture = this.#previousCapture ? this.#previousCapture.reconcile(capture) : capture;
            this.#stats.capture(reconciledCapture != this.#previousCapture)
            this.#previousCapture = reconciledCapture;
        } catch (e: unknown) {
            if (e instanceof Error) {
                this.#stats.error(e)
            } else {
                this.#stats.error(new Error(JSON.stringify(e)));
            }
        }
        return this.report();
    }

    report(): Capture {
        if (this.#previousCapture == null) {
            throw new Error("No value captured yet.")
        }
        return this.#previousCapture
    }

    print(format: Format): string {
        return new Formatter(format).print(this.report())
    }
}

function createCapture(value: any | null | undefined): Capture {
    if (value === null || value === undefined) return new NullCapture();
    else if (typeof value === 'number' && Number.isInteger(value)) return new PrimitiveCapture(CaptureType.INT, false);
    else if (typeof value === 'number' && !Number.isInteger(value)) return new PrimitiveCapture(CaptureType.DOUBLE, false);
    else if (typeof value === 'boolean') return new PrimitiveCapture(CaptureType.BOOLEAN, false);
    else if (typeof value === 'string') return new PrimitiveCapture(CaptureType.TEXT, false);
    else if (Array.isArray(value)) {
        if (value.length === 0) {
            return new ListCapture(false, new UnknownCapture())
        } else {
            const subtype = value
                .map((it) => createCapture(it))
                .reduce((acc, other) => acc.reconcile(other));
            return new ListCapture(false, subtype);
        }
    } else if (typeof value === 'object') {
        const fields = new Map<string, Capture>();
        Object.entries(value)
            .forEach(([key, value]) => {
                fields.set(key, createCapture(value))
            });

        return new ObjectCapture(false, fields);
    } else {
        throw new Error(`Unknown node-type: ${typeof value}`)
    }
}