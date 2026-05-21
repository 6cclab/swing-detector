import { useCallback, useEffect, useRef, useState } from "react";
import { useAudioPlayer, setAudioModeAsync } from "expo-audio";

const BPM = 72;
const INTERVAL = (60 / BPM) * 1000;

const tickSource = require("../../assets/audio/tick.wav");

export function useMetronome() {
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const player = useAudioPlayer(tickSource);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  const start = useCallback(() => {
    if (timerRef.current) return;
    setPlaying(true);

    const tick = () => {
      try {
        player.seekTo(0);
        player.play();
      } catch {}
    };

    tick();
    timerRef.current = setInterval(tick, INTERVAL);
  }, [player]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPlaying(false);
  }, []);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { playing, start, stop };
}
