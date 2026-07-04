import { socket } from './socket';

// Peer-to-peer voice chat over WebRTC. The server only relays SDP/ICE
// (see server sockets: rtc:offer / rtc:answer / rtc:ice and voice:* events);
// audio itself flows directly between browsers. A public STUN server handles
// NAT traversal, which covers most home/mobile networks.
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

type Listener = () => void;

class VoiceManager {
  private pcs = new Map<string, RTCPeerConnection>();
  private audioEls = new Map<string, HTMLAudioElement>();
  private localStream: MediaStream | null = null;
  active = false;
  muted = false;
  /** playerIds we currently have (or are forming) an audio link with. */
  peers = new Set<string>();
  error: string | null = null;

  private listeners = new Set<Listener>();

  constructor() {
    // These relay handlers are always registered; they no-op unless we're
    // actively in voice with a matching peer connection.
    socket.on('voice:peers', ({ peers }: { peers: { playerId: string }[] }) => {
      // We're the newcomer: initiate an offer to each existing peer.
      for (const p of peers) this.createOffer(p.playerId);
    });
    socket.on('voice:joined', () => {
      // A newcomer arrived; they will send us an offer, so just wait.
    });
    socket.on('voice:left', ({ playerId }: { playerId: string }) =>
      this.closePeer(playerId),
    );
    socket.on('rtc:offer', (p: { from: string; data: RTCSessionDescriptionInit }) =>
      this.onOffer(p.from, p.data),
    );
    socket.on('rtc:answer', (p: { from: string; data: RTCSessionDescriptionInit }) =>
      this.onAnswer(p.from, p.data),
    );
    socket.on('rtc:ice', (p: { from: string; data: RTCIceCandidateInit }) =>
      this.onIce(p.from, p.data),
    );
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private emit() {
    for (const fn of this.listeners) fn();
  }

  async join(): Promise<void> {
    if (this.active) return;
    this.error = null;
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
    } catch {
      this.error = 'Microphone access denied.';
      this.emit();
      return;
    }
    this.active = true;
    this.muted = false;
    socket.emit('voice:join');
    this.emit();
  }

  leave(): void {
    if (!this.active) return;
    socket.emit('voice:leave');
    for (const id of [...this.pcs.keys()]) this.closePeer(id);
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.localStream = null;
    this.active = false;
    this.peers.clear();
    this.emit();
  }

  toggle(): void {
    if (this.active) this.leave();
    else void this.join();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.localStream?.getAudioTracks().forEach((t) => (t.enabled = !muted));
    this.emit();
  }

  // ---- peer connection plumbing ----

  private makePc(peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.localStream
      ?.getTracks()
      .forEach((track) => pc.addTrack(track, this.localStream!));

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit('rtc:ice', { to: peerId, data: e.candidate });
      }
    };
    pc.ontrack = (e) => this.attachAudio(peerId, e.streams[0]);
    pc.onconnectionstatechange = () => {
      if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) {
        this.closePeer(peerId);
      }
    };

    this.pcs.set(peerId, pc);
    this.peers.add(peerId);
    this.emit();
    return pc;
  }

  private async createOffer(peerId: string): Promise<void> {
    if (!this.active || this.pcs.has(peerId)) return;
    const pc = this.makePc(peerId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('rtc:offer', { to: peerId, data: offer });
  }

  private async onOffer(
    peerId: string,
    offer: RTCSessionDescriptionInit,
  ): Promise<void> {
    if (!this.active) return;
    const pc = this.pcs.get(peerId) ?? this.makePc(peerId);
    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit('rtc:answer', { to: peerId, data: answer });
  }

  private async onAnswer(
    peerId: string,
    answer: RTCSessionDescriptionInit,
  ): Promise<void> {
    const pc = this.pcs.get(peerId);
    if (pc) await pc.setRemoteDescription(answer);
  }

  private async onIce(
    peerId: string,
    candidate: RTCIceCandidateInit,
  ): Promise<void> {
    const pc = this.pcs.get(peerId);
    if (pc) {
      try {
        await pc.addIceCandidate(candidate);
      } catch {
        /* candidate may arrive before remote description; browser retries */
      }
    }
  }

  private attachAudio(peerId: string, stream: MediaStream): void {
    let el = this.audioEls.get(peerId);
    if (!el) {
      el = document.createElement('audio');
      el.autoplay = true;
      el.style.display = 'none';
      document.body.appendChild(el);
      this.audioEls.set(peerId, el);
    }
    el.srcObject = stream;
  }

  private closePeer(peerId: string): void {
    this.pcs.get(peerId)?.close();
    this.pcs.delete(peerId);
    const el = this.audioEls.get(peerId);
    if (el) {
      el.srcObject = null;
      el.remove();
      this.audioEls.delete(peerId);
    }
    this.peers.delete(peerId);
    this.emit();
  }
}

export const voice = new VoiceManager();
