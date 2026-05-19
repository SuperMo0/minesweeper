import { GameManager } from './GameManager.js';

const appElement = document.getElementById('app');
if (appElement) {
    new GameManager(appElement);
}
