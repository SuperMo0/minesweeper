import { Cell } from './Cell.js';
import { initializeGrid } from './utils.js';

export type GameStatus = 'playing' | 'won' | 'lost';

export interface Stats {
    remainingFlagsCount: number;
}

export class Grid {
    sideLength: number;
    cellsTable: Cell[][];
    status: GameStatus = "playing";
    flaggedCount = 0;
    bombsCount = 0;
    revealedCount = 0;
    isInitialized = false;

    constructor(sideLength: number) {
        this.sideLength = sideLength;
        this.bombsCount = sideLength === 10 ? 10 : sideLength === 12 ? 20 : 40;
        this.cellsTable = initializeGrid<Cell>(this.sideLength, this.sideLength);
        this.initiateGrid();
    }

    initiateGrid() {
        for (let i = 0; i < this.sideLength; i++) {
            for (let j = 0; j < this.sideLength; j++) {
                this.cellsTable[i][j] = new Cell(false, i, j);
            }
        }
    }

    placeBombs(excludeI: number, excludeJ: number) {
        const validCells: Cell[] = [];
        for (let i = 0; i < this.sideLength; i++) {
            for (let j = 0; j < this.sideLength; j++) {
                if (Math.abs(i - excludeI) > 1 || Math.abs(j - excludeJ) > 1) {
                    validCells.push(this.cellsTable[i][j]);
                }
            }
        }

        validCells.sort(() => Math.random() - 0.5);
        for (let k = 0; k < this.bombsCount; k++) {
            validCells[k].isBomb = true;
        }
        this.isInitialized = true;
    }

    toggleFlagCell(i: number, j: number) {
        const currentCell = this.cellsTable[i][j];
        currentCell.toggleFlag();
        currentCell.isFlagged ? this.flaggedCount += 1 : this.flaggedCount -= 1;
        return [currentCell];
    }

    revealCell(i: number, j: number) {
        if (!this.isInitialized) {
            this.placeBombs(i, j);
        }

        const currentCell = this.cellsTable[i][j];
        if (currentCell.isFlagged || currentCell.isRevealed) {
            return [];
        }
        if (currentCell.isBomb) {
            this.status = 'lost';
            return [];
        }
        const updatedCells: Cell[] = [];
        this.floodFill(i, j, updatedCells);
        this.revealedCount += updatedCells.length;
        this.checkGameWin();
        return updatedCells;
    }

    getBombsPositions() {
        const cells: Cell[] = [];
        for (const row of this.cellsTable) {
            for (const cell of row) {
                if (cell.isBomb) {
                    cells.push(cell);
                }
            }
        }
        return cells;
    }

    countSurroundingsBombs(i: number, j: number) {
        let count = 0;
        let nextI, nextJ;
        for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
                nextI = i + di;
                nextJ = j + dj;
                if (nextI < 0 || nextI >= this.sideLength || nextJ < 0 || nextJ >= this.sideLength) {
                    continue;
                }
                if (this.cellsTable[nextI][nextJ].isBomb) {
                    count++;
                }
            }
        }
        return count;
    }

    checkGameWin() {
        if (this.revealedCount == this.sideLength ** 2 - this.bombsCount) {
            this.status = 'won';
        }
    }

    floodFill(i: number, j: number, updatedCells: Cell[]) {

        if (i < 0 || i >= this.sideLength || j < 0 || j >= this.sideLength) {
            return;
        }
        const currentCell = this.cellsTable[i][j];
        if (currentCell.isRevealed) {
            return;
        }
        currentCell.neighborBombs = this.countSurroundingsBombs(i, j);
        currentCell.reveal();
        updatedCells.push(currentCell);
        if (currentCell.neighborBombs != 0) {
            return;
        }
        for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
                const nextI = i + di;
                const nextJ = j + dj;
                this.floodFill(nextI, nextJ, updatedCells);
            }
        }
    }
    getStats() {
        return {
            remainingFlagsCount: this.bombsCount - this.flaggedCount
        }
    }
}
