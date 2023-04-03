import { describe, it, expect } from 'vitest';
import {StringBuilder} from "./StringBuilder";

describe('StringBuilder', () => {
    it('should aggregate lines', () => {
        const sb = new StringBuilder();
        sb.appendLine("hello");
        sb.appendLine("");
        sb.appendLine("world");

        const result = sb.toString();

        expect(result).to.equal("hello\n\nworld")
    })
});