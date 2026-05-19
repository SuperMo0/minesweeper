export function sleep(ms: number) {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
}

export function initializeGrid<T>(height: number, width: number) {
    let z = new Array(height).fill(null).map(() => new Array(width).fill(null));
    return z as T[][];
}

export class Observable {
    private listeners: Record<string, ((...args: any[]) => void)[]> = {};

    on(event: string, callback: (...args: any[]) => void) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    emit(event: string, ...args: any[]) {
        if (this.listeners[event]) {
            for (const cb of this.listeners[event]) {
                cb(...args);
            }
        }
    }
}
