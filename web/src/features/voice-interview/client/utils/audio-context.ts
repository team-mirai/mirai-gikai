/**
 * AudioContext のグローバルシングルトン。
 * 遷移元のボタンクリック（ユーザージェスチャー）時に prewarm し、
 * 遷移先で即座に TTS 再生できるようにする。
 */
let globalAudioContext: AudioContext | null = null;

function createAudioContext(): AudioContext {
  const AudioContextClass =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  return new AudioContextClass();
}

/**
 * ユーザージェスチャー内で呼ぶこと。
 * AudioContext を作成し resume() して "running" 状態にする。
 */
export function prewarmAudioContext(): void {
  if (globalAudioContext && globalAudioContext.state !== "closed") {
    globalAudioContext.resume();
    return;
  }
  globalAudioContext = createAudioContext();
  globalAudioContext.resume();
}

/**
 * グローバル AudioContext を取得する。
 * prewarm 済みならそれを返し、未作成なら新規作成する。
 */
export function getGlobalAudioContext(): AudioContext {
  if (!globalAudioContext || globalAudioContext.state === "closed") {
    globalAudioContext = createAudioContext();
  }
  return globalAudioContext;
}

/**
 * グローバル AudioContext を close して全音声を即停止する。
 * 次回 getGlobalAudioContext() 呼び出し時に新しいインスタンスが作成される。
 */
export function closeGlobalAudioContext(): void {
  if (globalAudioContext && globalAudioContext.state !== "closed") {
    globalAudioContext.close();
    globalAudioContext = null;
  }
}
