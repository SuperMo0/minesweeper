import { AudioPlayer } from './audio.js';
import { Grid } from './Grid.js';
import { GameView } from './GameView.js';
import { GameController } from './GameController.js';

export class GameManager {
    app: HTMLElement;
    restartButton: HTMLElement;
    levelSelector: HTMLSelectElement;
    muteButton: HTMLButtonElement;
    audioPlayer: AudioPlayer;
    size = 10;

    constructor(app: HTMLElement) {
        this.app = app;
        this.restartButton = app.querySelector('.restart-button') as HTMLElement;
        this.levelSelector = app.querySelector("select") as HTMLSelectElement;
        this.muteButton = document.getElementById("mute-button") as HTMLButtonElement;
        this.audioPlayer = new AudioPlayer();

        this.restartButton.onclick = () => { this.start() }
        this.levelSelector.onchange = (e) => {
            const target = e.target as HTMLSelectElement;
            this.setSize(target.value);
            this.start();
        }

        this.muteButton.onclick = () => {
            const isMuted = this.audioPlayer.toggleMute();
            this.muteButton.textContent = isMuted ? '🔇' : '🔊';
        }

        this.setSize("10");
        this.start();
    }

    setSize(size: string) {
        this.size = parseInt(size);
    }
    start() {
        this.app.style.setProperty("--side", this.size.toString());
        const grid = new Grid(this.size);
        const gameView = new GameView(this.app);
        new GameController(grid, gameView, this.audioPlayer);
    }
}
