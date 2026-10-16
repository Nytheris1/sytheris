"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  loadAudioFile,
  saveAudioFile,
  clearAudioFile,
} from "@/lib/audio-storage";

const DEFAULT_SRC = "/audio/ambient.mp3";
const PREF_KEY = "sytheris.audio.v1";
const VOLUME_KEY = "sytheris.audio.volume.v1";
const SOURCE_KEY = "sytheris.audio.source.v1";
const EQ_KEY = "sytheris.audio.eq.v1";

const DEFAULT_VOLUME = 0.5;
const FADE_MS = 320;
const VOLUME_FADE_MS = 60;

function perceptualGain(v: number): number {
  // 2.2 cok kisiyordu (volume 0.5 -> gain 0.22). 1.6 daha dogal.
  return Math.pow(Math.max(0, Math.min(1, v)), 1.6);
}

export type AudioSourceType = "default" | "url" | "file";

export interface AudioSource {
  type: AudioSourceType;
  value?: string;
  name?: string;
}

export interface EQSettings {
  bass: number;
  mid: number;
  treble: number;
}

export interface AudioFileInfo {
  name: string;
  size: number;
  type: string;
  duration?: number;
  bitrate?: number;
}

interface AudioContextValue {
  enabled: boolean;
  ready: boolean;
  volume: number;
  source: AudioSource;
  fileInfo: AudioFileInfo | null;
  eq: EQSettings;
  analyser: AnalyserNode | null;
  toggle: () => void;
  enable: () => void;
  setVolume: (v: number) => void;
  setSourceUrl: (url: string) => void;
  setSourceDefault: () => void;
  uploadFile: (file: File) => Promise<void>;
  removeFile: () => Promise<void>;
  setEQ: (patch: Partial<EQSettings>) => void;
  resetEQ: () => void;
}

const Ctx = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const bassRef = useRef<BiquadFilterNode | null>(null);
  const midRef = useRef<BiquadFilterNode | null>(null);
  const trebleRef = useRef<BiquadFilterNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const fadeRef = useRef<number | null>(null);

  const [enabled, setEnabled] = useState(false);
  const [hasPref, setHasPref] = useState(false);
  const [ready, setReady] = useState(false);
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME);
  const [source, setSource] = useState<AudioSource>({ type: "default" });
  const [fileInfo, setFileInfo] = useState<AudioFileInfo | null>(null);
  const [eq, setEqState] = useState<EQSettings>({ bass: 0, mid: 0, treble: 0 });
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.volume = 1;
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";

    audio.addEventListener("canplaythrough", () => setReady(true));
    audio.addEventListener("loadeddata", () => setReady(true));
    audio.addEventListener("error", () => setReady(false));

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  const initGraph = useCallback(() => {
    if (audioCtxRef.current) return;
    const audio = audioRef.current;
    if (!audio) return;
    try {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new Ctor();

      const sourceNode = ctx.createMediaElementSource(audio);

      const bass = ctx.createBiquadFilter();
      bass.type = "lowshelf";
      bass.frequency.value = 200;
      bass.gain.value = 0;

      const mid = ctx.createBiquadFilter();
      mid.type = "peaking";
      mid.frequency.value = 1000;
      mid.Q.value = 1;
      mid.gain.value = 0;

      const treble = ctx.createBiquadFilter();
      treble.type = "highshelf";
      treble.frequency.value = 3500;
      treble.gain.value = 0;

      const gain = ctx.createGain();
      gain.gain.value = 0;

      const anal = ctx.createAnalyser();
      anal.fftSize = 256;
      anal.smoothingTimeConstant = 0.82;

      sourceNode.connect(bass);
      bass.connect(mid);
      mid.connect(treble);
      treble.connect(gain);
      gain.connect(anal);
      anal.connect(ctx.destination);

      audioCtxRef.current = ctx;
      sourceNodeRef.current = sourceNode;
      bassRef.current = bass;
      midRef.current = mid;
      trebleRef.current = treble;
      gainRef.current = gain;
      analyserRef.current = anal;
      setAnalyser(anal);
    } catch {
      /* Web Audio yoksa sessiz kalır */
    }
  }, []);

  const fadeTo = useCallback(
    (target: number, onDone?: () => void, durationMs: number = FADE_MS) => {
      const gain = gainRef.current;
      if (!gain) return;
      if (fadeRef.current !== null) cancelAnimationFrame(fadeRef.current);
      const start = gain.gain.value;
      const startTime = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - startTime) / durationMs);
        gain.gain.value = Math.max(0, Math.min(1, start + (target - start) * t));
        if (t < 1) {
          fadeRef.current = requestAnimationFrame(step);
        } else {
          fadeRef.current = null;
          onDone?.();
        }
      };
      fadeRef.current = requestAnimationFrame(step);
    },
    [],
  );

  useEffect(() => {
    try {
      const pref = localStorage.getItem(PREF_KEY);
      if (pref === "on") {
        setEnabled(true);
        setHasPref(true);
      } else if (pref === "off") {
        setEnabled(false);
        setHasPref(true);
      }

      const vol = localStorage.getItem(VOLUME_KEY);
      if (vol) {
        const v = parseFloat(vol);
        if (!Number.isNaN(v) && v >= 0 && v <= 1) setVolumeState(v);
      }

      const src = localStorage.getItem(SOURCE_KEY);
      if (src) {
        const parsed = JSON.parse(src) as AudioSource;
        if (parsed?.type) setSource(parsed);
      }

      const storedEq = localStorage.getItem(EQ_KEY);
      if (storedEq) {
        const parsed = JSON.parse(storedEq) as EQSettings;
        setEqState({
          bass: parsed.bass ?? 0,
          mid: parsed.mid ?? 0,
          treble: parsed.treble ?? 0,
        });
      }
    } catch {
      /* yoksay */
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let cancelled = false;

    async function loadSource() {
      if (!audio) return;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      if (source.type === "default") {
        audio.src = DEFAULT_SRC;
        setFileInfo(null);
        return;
      }

      if (source.type === "url" && source.value) {
        audio.src = source.value;
        setFileInfo(null);
        return;
      }

      if (source.type === "file") {
        const blob = await loadAudioFile();
        if (cancelled) return;
        if (blob) {
          const url = URL.createObjectURL(blob);
          objectUrlRef.current = url;
          audio.src = url;

          const anyBlob = blob as Blob & { name?: string };
          const name = anyBlob.name ?? source.name ?? "yüklenen dosya";
          const type = blob.type || "audio/mpeg";

          const probe = new Audio();
          probe.preload = "metadata";
          probe.src = url;
          probe.onloadedmetadata = () => {
            if (cancelled) return;
            const dur = probe.duration;
            const bitrate =
              dur && dur > 0
                ? Math.round((blob.size * 8) / dur / 1000)
                : undefined;
            setFileInfo({ name, size: blob.size, type, duration: dur, bitrate });
          };
          probe.onerror = () => {
            if (cancelled) return;
            setFileInfo({ name, size: blob.size, type });
          };
        } else {
          setSource({ type: "default" });
        }
      }
    }

    loadSource();

    if (enabled) {
      const tryPlay = () => {
        if (!audio) return;
        initGraph();
        audioCtxRef.current?.resume().catch(() => {});
        audio
          .play()
          .then(() => fadeTo(perceptualGain(volume)))
          .catch(() => {});
      };
      if (audio.readyState >= 2) tryPlay();
      else audio.addEventListener("loadeddata", tryPlay, { once: true });
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  useEffect(() => {
    if (!enabled) return;
    const gain = gainRef.current;
    if (!gain) return;
    fadeTo(perceptualGain(volume), undefined, VOLUME_FADE_MS);
  }, [volume, enabled, fadeTo]);

  useEffect(() => {
    if (bassRef.current) bassRef.current.gain.value = eq.bass;
    if (midRef.current) midRef.current.gain.value = eq.mid;
    if (trebleRef.current) trebleRef.current.gain.value = eq.treble;
  }, [eq]);

  const playNow = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    initGraph();
    audioCtxRef.current?.resume().catch(() => {});
    const target = perceptualGain(volume);
    if (!audio.paused) {
      fadeTo(target);
      return;
    }
    audio
      .play()
      .then(() => fadeTo(target))
      .catch(() => {
        /* autoplay engellendi */
      });
  }, [fadeTo, volume, initGraph]);

  const enable = useCallback(() => {
    setEnabled(true);
    setHasPref(true);
    try {
      localStorage.setItem(PREF_KEY, "on");
    } catch {
      /* yoksay */
    }
    playNow();
  }, [playNow]);

  const disable = useCallback(() => {
    setEnabled(false);
    setHasPref(true);
    try {
      localStorage.setItem(PREF_KEY, "off");
    } catch {
      /* yoksay */
    }
    fadeTo(0, () => {
      const audio = audioRef.current;
      if (audio) audio.pause();
    });
  }, [fadeTo]);

  const toggle = useCallback(() => {
    if (enabled) disable();
    else enable();
  }, [enabled, enable, disable]);

  useEffect(() => {
    if (hasPref) return;
    if (typeof window === "undefined") return;
    const kick = () => {
      enable();
      window.removeEventListener("pointerdown", kick);
      window.removeEventListener("keydown", kick);
      window.removeEventListener("touchstart", kick);
    };
    window.addEventListener("pointerdown", kick, { once: true });
    window.addEventListener("keydown", kick, { once: true });
    window.addEventListener("touchstart", kick, { once: true });
    return () => {
      window.removeEventListener("pointerdown", kick);
      window.removeEventListener("keydown", kick);
      window.removeEventListener("touchstart", kick);
    };
  }, [hasPref, enable]);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    try {
      localStorage.setItem(VOLUME_KEY, String(clamped));
    } catch {
      /* yoksay */
    }
  }, []);

  const setSourceUrl = useCallback((url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    const next: AudioSource = { type: "url", value: trimmed };
    setSource(next);
    try {
      localStorage.setItem(SOURCE_KEY, JSON.stringify(next));
    } catch {
      /* yoksay */
    }
  }, []);

  const setSourceDefault = useCallback(() => {
    const next: AudioSource = { type: "default" };
    setSource(next);
    try {
      localStorage.setItem(SOURCE_KEY, JSON.stringify(next));
    } catch {
      /* yoksay */
    }
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    await saveAudioFile(file);
    const next: AudioSource = { type: "file", name: file.name };
    setSource(next);
    try {
      localStorage.setItem(SOURCE_KEY, JSON.stringify(next));
    } catch {
      /* yoksay */
    }
  }, []);

  const removeFile = useCallback(async () => {
    await clearAudioFile();
    setSourceDefault();
  }, [setSourceDefault]);

  const setEQ = useCallback((patch: Partial<EQSettings>) => {
    setEqState((prev) => {
      const next: EQSettings = {
        bass: Math.max(-12, Math.min(12, patch.bass ?? prev.bass)),
        mid: Math.max(-12, Math.min(12, patch.mid ?? prev.mid)),
        treble: Math.max(-12, Math.min(12, patch.treble ?? prev.treble)),
      };
      try {
        localStorage.setItem(EQ_KEY, JSON.stringify(next));
      } catch {
        /* yoksay */
      }
      return next;
    });
  }, []);

  const resetEQ = useCallback(() => {
    setEQ({ bass: 0, mid: 0, treble: 0 });
  }, [setEQ]);

  return (
    <Ctx.Provider
      value={{
        enabled,
        ready,
        volume,
        source,
        fileInfo,
        eq,
        analyser,
        toggle,
        enable,
        setVolume,
        setSourceUrl,
        setSourceDefault,
        uploadFile,
        removeFile,
        setEQ,
        resetEQ,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return {
      enabled: false,
      ready: false,
      volume: DEFAULT_VOLUME,
      source: { type: "default" } as AudioSource,
      fileInfo: null,
      eq: { bass: 0, mid: 0, treble: 0 },
      analyser: null,
      toggle: () => {},
      enable: () => {},
      setVolume: () => {},
      setSourceUrl: () => {},
      setSourceDefault: () => {},
      uploadFile: async () => {},
      removeFile: async () => {},
      setEQ: () => {},
      resetEQ: () => {},
    } satisfies AudioContextValue;
  }
  return ctx;
}