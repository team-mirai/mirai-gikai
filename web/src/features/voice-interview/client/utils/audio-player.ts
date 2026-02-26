import { getGlobalAudioContext } from "./audio-context";

export class AudioPlayer {
  private audioContext: AudioContext;
  private nextStartTime = 0;
  private _isPlaying = false;
  private _cancelled = false;
  private activeSources: AudioBufferSourceNode[] = [];
  private onComplete: (() => void) | null = null;
  private pendingCount = 0;

  constructor() {
    this.audioContext = getGlobalAudioContext();
  }

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  async resume(): Promise<void> {
    this._cancelled = false;
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }
    if (this.audioContext.state === "suspended") {
      throw new Error("AudioContext is suspended (user gesture required)");
    }
  }

  async play(mp3Data: Uint8Array, onDone?: () => void): Promise<void> {
    const arrayBuffer = mp3Data.buffer.slice(
      mp3Data.byteOffset,
      mp3Data.byteOffset + mp3Data.byteLength
    ) as ArrayBuffer;

    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    // cancelAll() が decode 中に呼ばれた場合、新しいソースを開始しない
    if (this._cancelled) return;

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
    this._cancelled = true;
    this.onComplete = null;
    for (const source of this.activeSources) {
      try {
        source.onended = null;
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
    // AudioContext を suspend して予約済み音声も即停止
    if (this.audioContext.state === "running") {
      this.audioContext.suspend();
    }
  }

  dispose(): void {
    this.cancelAll();
    // グローバル AudioContext は他で再利用するため close しない
  }
}
