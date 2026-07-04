import type { ClueEntry } from '../types';

export function ClueBubble({
  clue,
  isSelf,
}: {
  clue: ClueEntry;
  isSelf: boolean;
}) {
  return (
    <div className={`clue-bubble ${isSelf ? 'self' : ''}`}>
      <span className="clue-author">{clue.nickname}</span>
      <span className="clue-text">{clue.clue}</span>
    </div>
  );
}
