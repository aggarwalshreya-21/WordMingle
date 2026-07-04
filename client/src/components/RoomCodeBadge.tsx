import { useState } from 'react';

export function RoomCodeBadge({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be unavailable; the code is still visible */
    }
  };

  return (
    <button className="room-code" onClick={copy} title="Tap to copy">
      <span className="label">Room</span>
      <span className="code">{code}</span>
      <span className="copy-hint">{copied ? 'copied!' : 'tap to copy'}</span>
    </button>
  );
}
