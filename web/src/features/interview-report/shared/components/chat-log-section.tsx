import { Bot, UserRound } from "lucide-react";
import { getMessageDisplayText } from "../utils/get-message-display-text";
import { splitByQuote } from "../utils/split-by-quote";

interface ChatLogSectionProps {
  messages: ChatLogMessage[];
  /** 引用元の逐語テキスト。該当メッセージ内の一致部分を太字表示する。 */
  highlightQuote?: string;
}

interface ChatLogMessage {
  id: string;
  role: string;
  content: string;
}

/** メッセージ本文を表示し、引用一致部分を太字にする。 */
function MessageText({ text, quote }: { text: string; quote?: string }) {
  return (
    <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap text-gray-800">
      {splitByQuote(text, quote).map((segment, index) =>
        segment.highlight ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: セグメントは順序固定で再並びしない
          <strong key={index} className="font-bold text-mirai-text">
            {segment.text}
          </strong>
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: セグメントは順序固定で再並びしない
          <span key={index}>{segment.text}</span>
        )
      )}
    </p>
  );
}

export function ChatLogSection({
  messages,
  highlightQuote,
}: ChatLogSectionProps) {
  if (messages.length === 0) {
    return null;
  }

  return (
    <section id="chat-log" className="flex flex-col gap-4 scroll-mt-24">
      <h2 className="text-xl font-bold text-gray-800">🎤すべての会話ログ</h2>
      <div className="bg-white rounded-2xl p-6">
        <div className="flex flex-col gap-4">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              highlightQuote={highlightQuote}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

interface ChatMessageProps {
  message: ChatLogMessage;
  highlightQuote?: string;
}

function ChatMessage({ message, highlightQuote }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";

  if (isAssistant) {
    const displayText = getMessageDisplayText(message.content);

    return (
      <div
        id={`message-${message.id}`}
        className="flex flex-col items-start gap-2 scroll-mt-24"
      >
        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
          <Bot size={24} className="text-gray-600" />
        </div>
        <MessageText text={displayText} quote={highlightQuote} />
      </div>
    );
  }

  return (
    <div
      id={`message-${message.id}`}
      className="flex flex-col items-end gap-2 scroll-mt-24"
    >
      <div className="w-9 h-9 rounded-full bg-mirai-light-gradient flex items-center justify-center">
        <UserRound size={20} className="text-gray-600" />
      </div>
      <div className="bg-mirai-light-gradient rounded-2xl px-4 py-3 max-w-[85%]">
        <MessageText text={message.content} quote={highlightQuote} />
      </div>
    </div>
  );
}
