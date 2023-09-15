import {CaptureType} from "./CaptureType";
import * as SetUtils from "./utils/SetUtils";
import {CaptureConfig} from "./Typeanalyzer";

export abstract class Capture {
    readonly type: CaptureType;
    protected constructor(type: CaptureType) {
        this.type = type;
    }

    reconcile(captureConfig: CaptureConfig, other: Capture): Capture {
        if (this.constructor.name !== other.constructor.name) {
            if (this instanceof UnknownCapture) return other;
            else if (other instanceof UnknownCapture) return this;
            else if (this instanceof NullCapture && other instanceof PrimitiveCapture) return other.copy({ nullable: true }).addValue(captureConfig, null);
            else if (this instanceof NullCapture && other instanceof ListCapture) return other.copy({ nullable: true })
            else if (this instanceof NullCapture && other instanceof ObjectCapture) return other.copy({ nullable: true })
            else if (this instanceof PrimitiveCapture && other instanceof NullCapture) return this.copy({ nullable: true }).addValue(captureConfig, null)
            else if (this instanceof ListCapture && other instanceof NullCapture) return this.copy({ nullable: true })
            else if (this instanceof ObjectCapture && other instanceof NullCapture) return this.copy({ nullable: true })
            else throw new Error(`
                Type mismatch, and could not reconcile types. Expected type ${this.type}, but got ${other.type}.
                Base: ${JSON.stringify(this)}
                Other: ${JSON.stringify(other)}
            `)
        } else {
            if (this instanceof PrimitiveCapture) {
                return this.copy({
                    nullable: this.nullable || (other as PrimitiveCapture).nullable,
                    values: [...this.values, ...(other as PrimitiveCapture).values].slice(0, captureConfig.uniontypeThreshold + 1)
                });
            } else if (this instanceof ListCapture) {
                const otherCapture = other as ListCapture;
                return this.copy({
                    nullable: this.nullable || otherCapture.nullable,
                    subtype: this.subtype.reconcile(captureConfig, otherCapture.subtype)
                })
            } else if (this instanceof ObjectCapture) {
                const otherCapture = other as ObjectCapture;
                const thisKeys = new Set(this.fields.keys());
                const otherKeys = new Set(otherCapture.fields.keys());
                const thisFields = this.fields;
                const otherFields = otherCapture.fields;

                const commonKeys = SetUtils.intersection(thisKeys, otherKeys);
                const newKeys = SetUtils.minus(otherKeys, thisKeys);
                const missingKeys = SetUtils.minus(thisKeys, otherKeys);

                const newFields = new Map<string, Capture>();
                commonKeys.forEach((key) => {
                    newFields.set(key, thisFields.get(key)!.reconcile(captureConfig, otherFields.get(key)!));
                });
                newKeys.forEach((key) => {
                    const field = otherFields.get(key)!;
                    if (field instanceof PrimitiveCapture || field instanceof ListCapture || field instanceof ObjectCapture) {
                        newFields.set(key, field.copy({ nullable: true }))
                    }
                    else {
                        newFields.set(key, field)
                    }
                });
                missingKeys.forEach((key) => {
                    const field = thisFields.get(key)!;
                    if (field instanceof PrimitiveCapture || field instanceof ListCapture || field instanceof ObjectCapture) {
                        newFields.set(key, field.copy({ nullable: true }))
                    }
                    else {
                        newFields.set(key, field)
                    }
                });

                return this.copy({
                    nullable: this.nullable || otherCapture.nullable,
                    fields: newFields
                });
            } else return this;
        }
    }
}
export class UnknownCapture extends Capture {
    constructor() {
        super(CaptureType.UNKNOWN);
    }
}
export class NullCapture extends Capture {
    constructor() {
        super(CaptureType.NULL);
    }
}

export class PrimitiveCapture extends Capture {
    readonly nullable: boolean;
    readonly values = new Set<any>();
    constructor(type: CaptureType, nullable: boolean, values: any[] = []) {
        super(type);
        this.nullable = nullable;
        this.values = new Set(values);
    }

    copy({ type = this.type, nullable = this.nullable, values = Array.from(this.values) }): PrimitiveCapture {
        return new PrimitiveCapture(type, nullable, values)
    }

    addValue(config: CaptureConfig, value: any): PrimitiveCapture {
        if (config.lut[this.type] && this.values.size <= config.uniontypeThreshold) {
            this.values.add(value);
        }
        return this;
    }
}

export class ListCapture extends Capture {
    readonly nullable: boolean;
    readonly subtype: Capture;
    constructor(nullable: boolean, subtype: Capture) {
        super(CaptureType.LIST);
        this.nullable = nullable;
        this.subtype = subtype;
    }

    copy({ nullable = this.nullable, subtype = this.subtype}): ListCapture {
        return new ListCapture(nullable, subtype)
    }
}

export class ObjectCapture extends Capture {
    readonly nullable: boolean;
    readonly fields: Map<string, Capture>;
    constructor(nullable: boolean, fields: Map<string, Capture>) {
        super(CaptureType.OBJECT);
        this.nullable = nullable;
        this.fields = fields;
    }

    copy({ nullable = this.nullable, fields = this.fields}): ObjectCapture {
        return new ObjectCapture(nullable, fields)
    }
}