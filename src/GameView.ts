import { Cell } from './Cell.js';
import { GameStatus, Stats } from './Grid.js';
import { Observable, initializeGrid, sleep } from './utils.js';

export class GameView extends Observable {

    gridElement!: HTMLElement;
    cellsElements!: HTMLElement[][];
    rootElement: HTMLElement;

    constructor(rootElement: HTMLElement) {
        super();
        this.rootElement = rootElement;
    }

    buildGrid(sideLength: number) {
        this.cellsElements = initializeGrid<HTMLElement>(sideLength, sideLength);
        const gridElement = document.createElement('div');
        gridElement.classList.add('grid');
        for (let i = 0; i < sideLength; i++) {
            for (let j = 0; j < sideLength; j++) {
                const cellElement = document.createElement('div');
                cellElement.classList.add('cell');
                cellElement.dataset.i = i.toString();
                cellElement.dataset.j = j.toString();
                this.cellsElements[i][j] = cellElement;
                gridElement.appendChild(cellElement);
            }
        }
        this.gridElement = gridElement;
        const gridContainerElement = this.rootElement.querySelector('.grid-container');
        if (gridContainerElement) {
            gridContainerElement.replaceChildren();
            gridContainerElement.appendChild(gridElement);
        }
        this.rootElement.setAttribute('game-status', "playing");
        this.bindEvents();
    }

    private createSelectionWidget() {
        const template = document.getElementById('selection-widget-template') as HTMLTemplateElement;
        const clone = template.content.cloneNode(true) as DocumentFragment;

        const widget = clone.querySelector('.selection-widget') as HTMLElement;
        const revealBtn = clone.querySelector('.reveal-btn') as HTMLButtonElement;
        const flagBtn = clone.querySelector('.flag-btn') as HTMLButtonElement;

        this.gridElement.appendChild(clone);

        return { widget, revealBtn, flagBtn };
    }

    private bindEvents() {
        const { widget, revealBtn, flagBtn } = this.createSelectionWidget();
        let currentTarget: { i: number; j: number } | null = null;

        const hideWidget = () => {
            widget.style.display = 'none';
            currentTarget = null;
        };

        revealBtn.onclick = (e) => {
            e.stopPropagation();
            if (currentTarget) this.emit('leftClick', currentTarget.i, currentTarget.j);
            hideWidget();
        };

        flagBtn.onclick = (e) => {
            e.stopPropagation();
            if (currentTarget) this.emit('rightClick', currentTarget.i, currentTarget.j);
            hideWidget();
        };

        this.gridElement.addEventListener("click", (e) => {
            e.stopPropagation();
            const target = e.target as HTMLElement;
            if (!target.classList.contains('cell') || target.classList.contains('revealed')) {
                hideWidget();
                return;
            }

            const i = parseInt(target.dataset.i!);
            const j = parseInt(target.dataset.j!);
            currentTarget = { i, j };

            const rect = target.getBoundingClientRect();
            widget.style.display = 'flex';
            widget.style.left = `${rect.left}px`;
            widget.style.top = `${rect.top - widget.offsetHeight - 5}px`;
        });

        const onDocClick = () => {
            if (!this.gridElement.isConnected) {
                document.removeEventListener("click", onDocClick);
                return;
            }
            hideWidget();
        };
        document.addEventListener("click", onDocClick);

        this.gridElement.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            hideWidget();
            this.delegateToController(e, (i, j) => this.emit('rightClick', i, j));
        });
    }

    delegateToController(e: Event, callback: (i: number, j: number) => void) {
        const target = e.target as HTMLElement;
        if (!target.classList.contains('cell')) return;
        const i = parseInt(target.dataset.i!);
        const j = parseInt(target.dataset.j!);
        callback(i, j);
    }

    renderCells(updatedCells: Cell[]) {
        for (const cell of updatedCells) {
            this.renderCell(cell);
        }
    }

    renderStats(stats: Stats) {
        const statsElement = this.rootElement.querySelector(".remaining-flags-count");
        if (statsElement) {
            statsElement.textContent = stats.remainingFlagsCount.toString();
        }
    }

    renderCell(cellData: Cell) {
        const i = cellData.i;
        const j = cellData.j;
        const cellElement = this.cellsElements[i][j];
        if (cellData.isRevealed) {
            cellElement.classList.add('revealed');
            if (cellData.isBomb) {
                cellElement.textContent = "💣";
            }
            else {
                cellElement.textContent = cellData.neighborBombs.toString();
            }
        }
        else if (cellData.isFlagged) {
            cellElement.textContent = "🚩";
        }
        else cellElement.textContent = "";
    }

    async playBombRevealAnimation(bombsArray: Cell[]) {
        for (const cell of bombsArray) {
            const i = cell.i;
            const j = cell.j;
            this.cellsElements[i][j].textContent = "💣";
            await sleep(100);
        }
    }
    updateGameStatus(status: GameStatus) {
        const message = this.rootElement.querySelector('.message');
        if (message) {
            if (status == "won") {
                message.textContent = "Congrats you won 🥳";
            } else {
                message.textContent = "mmmm... maybe try again 🔁";
            }
        }
        this.rootElement.setAttribute('game-status', status);
    }
}
