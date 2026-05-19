import { Cell } from './Cell.js';
import { Grid } from './Grid.js';
import { GameView } from './GameView.js';
import { AudioPlayer } from './audio.js';

export class GameController {
    gridModel: Grid;
    view: GameView;
    audio: AudioPlayer;

    constructor(gridModel: Grid, view: GameView, audio: AudioPlayer) {
        this.gridModel = gridModel;
        this.view = view;
        this.audio = audio;

        this.view.buildGrid(gridModel.sideLength);

        this.view.on('leftClick', this.handleReveal.bind(this));
        this.view.on('rightClick', this.handleToggleflag.bind(this));
        this.syncStatsWithView();

    }

    handleReveal(i: number, j: number) {
        if (this.gridModel.status != "playing") return;
        this.audio.playClick();
        const updatedCells = this.gridModel.revealCell(i, j);
        this.decideNextMove(updatedCells);
    }

    handleToggleflag(i: number, j: number) {
        if (this.gridModel.status != "playing") return;
        this.audio.playFlag();
        const updatedCells = this.gridModel.toggleFlagCell(i, j);
        this.decideNextMove(updatedCells);
    }

    decideNextMove(updatedCells: Cell[]) {
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

    syncCellsWithView(updatedCells: Cell[]) {
        this.view.renderCells(updatedCells);
    }
}
