export class CaptureStats {
    #count: number = 0;
    #countSizeLastChange: number = 0;
    #errors: number = 0;
    #lastError: Error | null = null;

    public get count(): number {
        return this.#count;
    }

    public get countSizeLastChange(): number {
        return this.#countSizeLastChange;
    }

    public get errors(): number {
        return this.#errors;
    }

    public get lastError(): Error | null {
        return this.#lastError;
    }


    public get confidence(): number {
        return this.#countSizeLastChange / this.#count;
    }

    public capture(changed: boolean) {
        this.#count++;
        if (changed) {
            this.#countSizeLastChange = 0;
        } else {
            this.#countSizeLastChange++;
        }
    }

    public error(error: Error) {
        this.#errors++;
        this.#lastError = error;
    }
}