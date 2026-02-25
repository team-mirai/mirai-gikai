export class AudioPlayer {
  private audioContext: AudioContext;
  private nextStartTime = 0;
  private _isPlaying = false;
  private activeSources: AudioBufferSourceNode[] = [];
  private onComplete: (() => void) | null = null;
  private pendingCount = 0;

  constructor() {
    const AudioContextClass =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    this.audioContext = new AudioContextClass();
  }

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  async resume(): Promise<void> {
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }
  }

  async play(mp3Data: Uint8Array, onDone?: () => void): Promise<void> {
    const arrayBuffer = mp3Data.buffer.slice(
      mp3Data.byteOffset,
      mp3Data.byteOffset + mp3Data.byteLength
    ) as ArrayBuffer;

    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);

    const currentTime = this.audioContext.currentTime;
    const startTime = Math.max(this.nextStartTime, currentTime);
    source.start(startTime);
    this.nextStartTime = startTime + audioBuffer.duration;

    this._isPlaying = true;
    this.pendingCount++;
    this.activeSources.push(source);

    source.onended = () => {
      this.activeSources = this.activeSources.filter((s) => s !== source);
      this.pendingCount--;
      onDone?.();
      if (this.pendingCount <= 0 && this.activeSources.length === 0) {
        this._isPlaying = false;
        this.onComplete?.();
      }
    };
  }

  setOnComplete(cb: (() => void) | null): void {
    this.onComplete = cb;
  }

  cancelAll(): void {
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // ignore if already stopped
      }
    }
    this.activeSources = [];
    this.nextStartTime = 0;
    this.pendingCount = 0;
    this._isPlaying = false;
  }

  dispose(): void {
    this.cancelAll();
    this.audioContext.close();
  }
}
