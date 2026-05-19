export class AudioPlayer {
    muted = false;
    clickAudio;
    flagAudio;
    bombAudio;
    constructor() {
        this.clickAudio = document.getElementById("sound-click");
        this.flagAudio = document.getElementById("sound-flag");
        this.bombAudio = document.getElementById("sound-bomb");
    }
    toggleMute() {
        this.muted = !this.muted;
        this.clickAudio.muted = this.muted;
        this.flagAudio.muted = this.muted;
        this.bombAudio.muted = this.muted;
        return this.muted;
    }
    playClick() {
        if (this.muted)
            return;
        this.clickAudio.currentTime = 0;
        this.clickAudio.play().catch(() => { });
    }
    playFlag() {
        if (this.muted)
            return;
        this.flagAudio.currentTime = 0;
        this.flagAudio.play().catch(() => { });
    }
    playBomb() {
        if (this.muted)
            return;
        this.bombAudio.currentTime = 0;
        this.bombAudio.play().catch(() => { });
    }
}
