const EMOJIS = [
  '😀', '😂', '😅', '😍', '😎', '🤔', '😶', '🙄',
  '😏', '😳', '😱', '🥳', '😴', '🤯', '😈', '🤡',
  '👍', '👎', '👏', '🙌', '🤝', '💪', '🙏', '👀',
  '🔥', '💯', '🎉', '❓', '❗', '💡', '🕵️', '🤫',
];

export function EmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  return (
    <div className="emoji-picker">
      {EMOJIS.map((e, i) => (
        <button
          key={i}
          type="button"
          className="emoji-btn"
          onClick={() => onPick(e)}
        >
          {e}
        </button>
      ))}
    </div>
  );
}
