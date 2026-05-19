export class Cell {
    i: number;
    j: number;
    isBomb: boolean;
    isFlagged = false;
    isRevealed = false;
    neighborBombs = 0;

    constructor(isBomb: boolean, i: number, j: number) {
        this.i = i;
        this.j = j;
        this.isBomb = isBomb;
    }

    reveal() {
        if (!this.isRevealed) {
            this.isRevealed = true;
        }
    }
    toggleFlag() {
        if (!this.isRevealed) {
            this.isFlagged = !this.isFlagged
        }
    }
}
