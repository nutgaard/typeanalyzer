export function intersection<T>(setA: Set<T>, setB: Set<T>): Set<T> {
    const _intersection = new Set<T>();
    for (const element of setA) {
        if (setB.has(element)) {
           _intersection.add(element);
        }
    }
    return _intersection;
}

export function minus<T>(setA: Set<T>, setB: Set<T>): Set<T> {
    const _leftOvers = new Set(setA);
    for (const element of setB) {
        _leftOvers.delete(element);
    }
    return _leftOvers;
}