import { AudioPlayer } from './audio.js';
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function initializeGrid(height, width) {
    let z = new Array(height).fill(null).map(() => new Array(width).fill(null));
    return z;
}
class Observable {
    listeners = {};
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }
    emit(event, ...args) {
        if (this.listeners[event]) {
            for (const cb of this.listeners[event]) {
                cb(...args);
            }
        }
    }
}
class Cell {
    i;
    j;
    isBomb;
    isFlagged = false;
    isRevealed = false;
    neighborBombs = 0;
    constructor(isBomb, i, j) {
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
            this.isFlagged = !this.isFlagged;
        }
    }
}
class Grid {
    sideLength;
    cellsTable;
    status = "playing";
    flaggedCount = 0;
    bombsCount = 0;
    revealedCount = 0;
    isInitialized = false;
    constructor(sideLength) {
        this.sideLength = sideLength;
        this.bombsCount = sideLength === 10 ? 10 : sideLength === 12 ? 20 : 40;
        this.cellsTable = initializeGrid(this.sideLength, this.sideLength);
        this.initiateGrid();
    }
    initiateGrid() {
        for (let i = 0; i < this.sideLength; i++) {
            for (let j = 0; j < this.sideLength; j++) {
                this.cellsTable[i][j] = new Cell(false, i, j);
            }
        }
    }
    placeBombs(excludeI, excludeJ) {
        const validCells = [];
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
    toggleFlagCell(i, j) {
        const currentCell = this.cellsTable[i][j];
        currentCell.toggleFlag();
        currentCell.isFlagged ? this.flaggedCount += 1 : this.flaggedCount -= 1;
        return [currentCell];
    }
    revealCell(i, j) {
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
        const updatedCells = [];
        this.floodFill(i, j, updatedCells);
        this.revealedCount += updatedCells.length;
        this.checkGameWin();
        return updatedCells;
    }
    getBombsPositions() {
        const cells = [];
        for (const row of this.cellsTable) {
            for (const cell of row) {
                if (cell.isBomb) {
                    cells.push(cell);
                }
            }
        }
        return cells;
    }
    countSurroundingsBombs(i, j) {
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
    floodFill(i, j, updatedCells) {
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
        };
    }
}
class GameView extends Observable {
    gridElement;
    cellsElements;
    rootElement;
    constructor(rootElement) {
        super();
        this.rootElement = rootElement;
    }
    buildGrid(sideLength) {
        this.cellsElements = initializeGrid(sideLength, sideLength);
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
    createSelectionWidget() {
        const template = document.getElementById('selection-widget-template');
        const clone = template.content.cloneNode(true);
        const widget = clone.querySelector('.selection-widget');
        const revealBtn = clone.querySelector('.reveal-btn');
        const flagBtn = clone.querySelector('.flag-btn');
        this.gridElement.appendChild(clone);
        return { widget, revealBtn, flagBtn };
    }
    bindEvents() {
        const { widget, revealBtn, flagBtn } = this.createSelectionWidget();
        let currentTarget = null;
        const hideWidget = () => {
            widget.style.display = 'none';
            currentTarget = null;
        };
        revealBtn.onclick = (e) => {
            e.stopPropagation();
            if (currentTarget)
                this.emit('leftClick', currentTarget.i, currentTarget.j);
            hideWidget();
        };
        flagBtn.onclick = (e) => {
            e.stopPropagation();
            if (currentTarget)
                this.emit('rightClick', currentTarget.i, currentTarget.j);
            hideWidget();
        };
        this.gridElement.addEventListener("click", (e) => {
            e.stopPropagation();
            const target = e.target;
            if (!target.classList.contains('cell') || target.classList.contains('revealed')) {
                hideWidget();
                return;
            }
            const i = parseInt(target.dataset.i);
            const j = parseInt(target.dataset.j);
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
    delegateToController(e, callback) {
        const target = e.target;
        if (!target.classList.contains('cell'))
            return;
        const i = parseInt(target.dataset.i);
        const j = parseInt(target.dataset.j);
        callback(i, j);
    }
    renderCells(updatedCells) {
        for (const cell of updatedCells) {
            this.renderCell(cell);
        }
    }
    renderStats(stats) {
        const statsElement = this.rootElement.querySelector(".remaining-flags-count");
        if (statsElement) {
            statsElement.textContent = stats.remainingFlagsCount.toString();
        }
    }
    renderCell(cellData) {
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
        else
            cellElement.textContent = "";
    }
    async playBombRevealAnimation(bombsArray) {
        for (const cell of bombsArray) {
            const i = cell.i;
            const j = cell.j;
            this.cellsElements[i][j].textContent = "💣";
            await sleep(100);
        }
    }
    updateGameStatus(status) {
        const message = this.rootElement.querySelector('.message');
        if (message) {
            if (status == "won") {
                message.textContent = "Congrats you won 🥳";
            }
            else {
                message.textContent = "mmmm... maybe try again 🔁";
            }
        }
        this.rootElement.setAttribute('game-status', status);
    }
}
class GameController {
    gridModel;
    view;
    audio;
    constructor(gridModel, view, audio) {
        this.gridModel = gridModel;
        this.view = view;
        this.audio = audio;
        this.view.buildGrid(gridModel.sideLength);
        this.view.on('leftClick', this.handleReveal.bind(this));
        this.view.on('rightClick', this.handleToggleflag.bind(this));
        this.syncStatsWithView();
    }
    handleReveal(i, j) {
        if (this.gridModel.status != "playing")
            return;
        this.audio.playClick();
        const updatedCells = this.gridModel.revealCell(i, j);
        this.decideNextMove(updatedCells);
    }
    handleToggleflag(i, j) {
        if (this.gridModel.status != "playing")
            return;
        this.audio.playFlag();
        const updatedCells = this.gridModel.toggleFlagCell(i, j);
        this.decideNextMove(updatedCells);
    }
    decideNextMove(updatedCells) {
        this.syncCellsWithView(updatedCells);
        this.syncStatsWithView();
        if (this.gridModel.status === "won") {
            this.handleGameWin();
        }
        else if (this.gridModel.status === "lost") {
            this.handleGameLost();
        }
    }
    syncStatsWithView() {
        this.view.renderStats(this.gridModel.getStats());
    }
    async handleGameLost() {
        const bombsPositions = this.gridModel.getBombsPositions();
        this.audio.playBomb();
        await this.view.playBombRevealAnimation(bombsPositions);
        this.view.updateGameStatus('lost');
    }
    handleGameWin() {
        this.view.updateGameStatus('won');
    }
    syncCellsWithView(updatedCells) {
        this.view.renderCells(updatedCells);
    }
}
class GameManager {
    app;
    restartButton;
    levelSelector;
    muteButton;
    audioPlayer;
    size = 10;
    constructor(app) {
        this.app = app;
        this.restartButton = app.querySelector('.restart-button');
        this.levelSelector = app.querySelector("select");
        this.muteButton = document.getElementById("mute-button");
        this.audioPlayer = new AudioPlayer();
        this.restartButton.onclick = () => { this.start(); };
        this.levelSelector.onchange = (e) => {
            const target = e.target;
            this.setSize(target.value);
            this.start();
        };
        this.muteButton.onclick = () => {
            const isMuted = this.audioPlayer.toggleMute();
            this.muteButton.textContent = isMuted ? '🔇' : '🔊';
        };
        this.setSize("10");
        this.start();
    }
    setSize(size) {
        this.size = parseInt(size);
    }
    start() {
        this.app.style.setProperty("--side", this.size.toString());
        const grid = new Grid(this.size);
        const gameView = new GameView(this.app);
        new GameController(grid, gameView, this.audioPlayer);
    }
}
const appElement = document.getElementById('app');
if (appElement) {
    new GameManager(appElement);
}
