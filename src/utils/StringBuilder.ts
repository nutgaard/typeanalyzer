export class StringBuilder {
    #lines: string[] = [];

    appendLine(line: string): StringBuilder {
        this.#lines.push(line);
        return this;
    }

    toString(): string {
        return this.#lines.join('\n');
    }
}