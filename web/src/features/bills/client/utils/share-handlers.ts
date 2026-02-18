export function shareOnTwitter(message: string, url: string) {
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    message
  )}&url=${encodeURIComponent(url)}`;
  window.open(shareUrl, "_blank", "noopener,noreferrer");
}

export function shareOnFacebook(url: string) {
  const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    url
  )}`;
  window.open(shareUrl, "_blank", "noopener,noreferrer");
}

export function shareOnLine(message: string, url: string) {
  const text = `${message} ${url}`;
  const shareUrl = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
  window.open(shareUrl, "_blank", "noopener,noreferrer");
}

export function shareOnThreads(message: string, url: string) {
  const text = `${message} ${url}`;
  const shareUrl = `https://www.threads.net/intent/post?text=${encodeURIComponent(
    text
  )}`;
  window.open(shareUrl, "_blank", "noopener,noreferrer");
}

export async function shareNative(message: string, url: string) {
  // Web Share API が利用可能な場合
  if (navigator.share) {
    try {
      await navigator.share({
        title: "みらい議会",
        text: message,
        url: url,
      });
    } catch (error) {
      // ユーザーがキャンセルした場合は何もしない
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Error sharing:", error);
      }
    }
  } else {
    // フォールバック: URLをクリップボードにコピー
    try {
      await navigator.clipboard.writeText(`${message} ${url}`);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }
}
