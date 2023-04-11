import {Capture, ListCapture, NullCapture, ObjectCapture, PrimitiveCapture, UnknownCapture} from "./Capture";
import {CaptureStats} from "./CaptureStats";
import {CaptureType} from "./CaptureType";
import {Format, Formatter, FormatterConfig} from "./Formatter";

export interface Config extends FormatterConfig {
    captureValuesFor: CaptureType[];
    uniontypeThreshold: number;
}
export type CaptureLUT = { [key in CaptureType]?: boolean };
export interface CaptureConfig extends Config {
    lut: CaptureLUT;
}
export class Typeanalyzer {
    #previousCapture: Capture | null = null;
    #stats: CaptureStats = new CaptureStats();
    #config: CaptureConfig;

    constructor(config: Config = { uniontypeThreshold: 0, captureValuesFor: [] }) {
        const captureLUT: CaptureLUT = {};

        for (const type of config.captureValuesFor) {
            captureLUT[type] = true;
        }
        this.#config = { ...config, lut: captureLUT };
    }

    public get stats(): CaptureStats {
        return this.#stats
    }

    capture(value: any | undefined | null): Capture {
        try {
            const json = JSON.stringify(value);
            const obj = JSON.parse(json);
            const capture: Capture = this.createCapture(obj);
            const reconciledCapture: Capture = this.#previousCapture ? this.#previousCapture.reconcile(this.#config, capture) : capture;
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
        return new Formatter(format, this.#config).print(this.report())
    }

    private createCapture(value: any | null | undefined): Capture {
        if (value === null || value === undefined) return new NullCapture();
        else if (typeof value === 'number' && Number.isInteger(value)) return new PrimitiveCapture(CaptureType.INT, false).addValue(this.#config, value);
        else if (typeof value === 'number' && !Number.isInteger(value)) return new PrimitiveCapture(CaptureType.DOUBLE, false).addValue(this.#config, value);
        else if (typeof value === 'boolean') return new PrimitiveCapture(CaptureType.BOOLEAN, false).addValue(this.#config, value);
        else if (typeof value === 'string') return new PrimitiveCapture(CaptureType.TEXT, false).addValue(this.#config, value);
        else if (Array.isArray(value)) {
            if (value.length === 0) {
                return new ListCapture(false, new UnknownCapture())
            } else {
                const subtype = value
                    .map((it) => this.createCapture(it))
                    .reduce((acc, other) => acc.reconcile(this.#config, other));
                return new ListCapture(false, subtype);
            }
        } else if (typeof value === 'object') {
            const fields = new Map<string, Capture>();
            Object.entries(value)
                .forEach(([key, value]) => {
                    fields.set(key, this.createCapture(value))
                });

            return new ObjectCapture(false, fields);
        } else {
            throw new Error(`Unknown node-type: ${typeof value}`)
        }
    }
}