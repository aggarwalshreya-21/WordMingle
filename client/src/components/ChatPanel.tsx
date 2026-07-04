import { useEffect, useRef, useState } from 'react';
import { actions } from '../actions';
import { useGame } from '../context/GameContext';
import { useVoice } from '../useVoice';
import { voice } from '../voice';
import { EmojiPicker } from './EmojiPicker';

export function ChatPanel() {
  const { state } = useGame();
  const v = useVoice();
  const [draft, setDraft] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to the newest message.
  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight });
  }, [state.chat.length]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    actions.sendChat(text);
    setDraft('');
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const addEmoji = (e: string) => {
    setDraft((d) => (d + e).slice(0, 300));
    inputRef.current?.focus();
  };

  const micTitle = !v.active
    ? 'Join voice chat'
    : v.muted
      ? 'Unmute mic'
      : 'Mute / leave voice';

  return (
    <div className="chat-panel">
      <div className="chat-feed" ref={feedRef}>
        {state.chat.length === 0 && (
          <p className="chat-empty">
            Say something, share a hunch, or drop an emoji 👀
          </p>
        )}
        {state.chat.map((m, i) => (
          <div
            key={i}
            className={`chat-msg ${m.playerId === state.playerId ? 'self' : ''}`}
          >
            <span className="chat-author">{m.nickname}</span>
            <span className="chat-text">{m.text}</span>
          </div>
        ))}
      </div>

      {v.active && (
        <div className="voice-status">
          <span className={`voice-dot ${v.muted ? 'muted' : 'live'}`} />
          <span className="voice-label">
            {v.muted ? 'Mic muted' : 'Voice on'}
            {v.peerCount > 0 && ` · ${v.peerCount} connected`}
          </span>
          <button className="voice-leave" onClick={() => voice.leave()}>
            Leave voice
          </button>
        </div>
      )}
      {v.error && <div className="voice-error">{v.error}</div>}

      {showEmoji && <EmojiPicker onPick={addEmoji} />}

      <div className="chat-bar">
        <button
          type="button"
          className="icon-btn emoji-toggle"
          onClick={() => setShowEmoji((s) => !s)}
          title="Emoji"
          aria-label="Emoji"
        >
          😊
        </button>

        <input
          ref={inputRef}
          className="chat-input"
          maxLength={300}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Type a message"
        />

        {draft.trim() ? (
          <button className="icon-btn send-btn" onClick={send} title="Send">
            ➤
          </button>
        ) : (
          <button
            type="button"
            className={`icon-btn mic-btn ${v.active ? (v.muted ? 'muted' : 'live') : ''}`}
            title={micTitle}
            aria-label={micTitle}
            onClick={() => {
              if (!v.active) voice.join();
              else voice.setMuted(!v.muted);
            }}
          >
            🎤
          </button>
        )}
      </div>
    </div>
  );
}
