import {CaptureType} from "./CaptureType";
import {StringBuilder} from "./utils/StringBuilder";
import {PRNG, randomInt, seededRandom} from "./Random";
import {Capture, ListCapture, ObjectCapture, PrimitiveCapture} from "./Capture";

export interface Format {
    appendType(sb: StringBuilder, type: Type): void

    fieldType(type: CaptureType, typeReference?: string): string
}

class Type {
    readonly name: string;
    readonly fields: Field[];

    constructor(name: string, fields: Field[]) {
        this.name = name;
        this.fields = fields;
    }
}

class Field {
    readonly name: string;
    readonly type: string;
    readonly nullability: boolean;

    constructor(name: string, type: string, nullability: boolean) {
        this.name = name;
        this.type = type;
        this.nullability = nullability;
    }
}

export class TypescriptFormat implements Format {
    appendType(sb: StringBuilder, type: Type): void {
        sb.appendLine(`interface ${type.name} {`)
        for (const field of type.fields) {
            sb.appendLine(`  ${field.name}: ${field.type}${field.nullability ? ' | null' : ''};`)
        }
        sb.appendLine(`}`)
    }

    fieldType(type: CaptureType, typeReference?: string): string {
        switch (type) {
            case CaptureType.UNKNOWN:
                return "any";
            case CaptureType.NULL:
                return "null";
            case CaptureType.BOOLEAN:
                return "boolean";
            case CaptureType.INT:
                return "number";
            case CaptureType.DOUBLE:
                return "number";
            case CaptureType.TEXT:
                return "string";
            case CaptureType.LIST:
                return `Array<${typeReference}>`;
            case CaptureType.OBJECT:
                return typeReference!;
        }
    }
}

export class KotlinFormat implements Format {
    appendType(sb: StringBuilder, type: Type): void {
        sb.appendLine(`data class ${type.name}(`)
        for (const field of type.fields) {
            sb.appendLine(`    val ${field.name}: ${field.type}${field.nullability ? '?' : ''},`)
        }
        sb.appendLine(`)`)
    }

    fieldType(type: CaptureType, typeReference?: string): string {
        switch (type) {
            case CaptureType.UNKNOWN:
                return "Any";
            case CaptureType.NULL:
                return "Unit";
            case CaptureType.BOOLEAN:
                return "Boolean";
            case CaptureType.INT:
                return "Int";
            case CaptureType.DOUBLE:
                return "Double";
            case CaptureType.TEXT:
                return "String";
            case CaptureType.LIST:
                return `List<${typeReference}>`;
            case CaptureType.OBJECT:
                return typeReference!;
        }
    }
}

export class Formatter {
    private format: Format;
    private rnd: PRNG;
    private nameMap = new Map<ObjectCapture, string>();

    constructor(format: Format, rnd: PRNG = seededRandom(1)) {
        this.format = format;
        this.rnd = rnd;
    }

    print(capture: Capture): string {
        const types = this.findTypes(capture);
        const sb = new StringBuilder();
        for (const type of types.values()) {
            this.format.appendType(sb, type);
            sb.appendLine("");
        }
        return sb.toString();
    }

    private findTypes(capture: Capture, current: Map<ObjectCapture, Type> = new Map()): Map<ObjectCapture, Type> {
        if (capture instanceof ObjectCapture) {
            const fieldTypes = Array.from(capture.fields.values())
                .map((it) => this.findTypes(it))
                .reduce((acc, other) => new Map([...acc, ...other]));

            current.set(capture, this.createType(capture));
            return new Map([...current, ...fieldTypes]);
        } else if (capture instanceof ListCapture) {
            return this.findTypes(capture.subtype, current);
        } else {
            return current;
        }
    }

    private createType(capture: ObjectCapture): Type {
        if (!this.nameMap.has(capture)) {
            this.nameMap.set(capture, `Generated_${randomInt(this.rnd).toString(16)}`)
        }
        const name = this.nameMap.get(capture)!;
        const fields = Array.from(capture.fields.entries())
            .map(([key, value]) => {
                let nullability: boolean;
                if (value instanceof PrimitiveCapture) nullability = value.nullable;
                else if (value instanceof ListCapture) nullability = value.nullable;
                else if (value instanceof ObjectCapture) nullability = value.nullable;
                else nullability = true;

                return new Field(key, this.createTypeName(value), nullability)
            })

        return new Type(name, fields)
    }

    private createTypeName(capture: Capture): string {
        if (capture instanceof ListCapture) return this.format.fieldType(capture.type, this.createTypeName(capture.subtype));
        else if (capture instanceof ObjectCapture) {
            if (!this.nameMap.has(capture)) {
                this.nameMap.set(capture, `Generated_${randomInt(this.rnd).toString(16)}`)
            }
            return this.nameMap.get(capture)!;
        } else {
            return this.format.fieldType(capture.type);
        }
    }
}