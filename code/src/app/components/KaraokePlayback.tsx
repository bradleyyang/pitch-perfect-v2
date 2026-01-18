"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { WordAnalysis } from "@/app/services/api";

interface KaraokePlaybackProps {
  audioUrl: string;
  wordAnalysis: WordAnalysis[];
  transcription: string;
  timestamps: [number, number][]; // [time, spm]
}

export function KaraokePlayback({
  audioUrl,
  wordAnalysis,
  transcription,
  timestamps,
}: KaraokePlaybackProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [playbackRate, setPlaybackRate] = useState(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // Calculate the total duration from timestamps if available
  const totalDuration = timestamps.length > 0
    ? timestamps[timestamps.length - 1][0]
    : duration;

  // Calculate word timings by distributing words evenly across the duration
  const wordTimings = wordAnalysis.map((_, index) => {
    const wordDuration = totalDuration / wordAnalysis.length;
    return {
      start: index * wordDuration,
      end: (index + 1) * wordDuration,
    };
  });

  // Update current word based on playback time
  useEffect(() => {
    if (!isPlaying || wordTimings.length === 0) return;

    const newIndex = wordTimings.findIndex(
      (timing) => currentTime >= timing.start && currentTime < timing.end
    );

    if (newIndex !== currentWordIndex && newIndex !== -1) {
      setCurrentWordIndex(newIndex);

      // Auto-scroll to keep current word in view
      const wordEl = wordRefs.current[newIndex];
      if (wordEl && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const wordRect = wordEl.getBoundingClientRect();

        if (wordRect.top < containerRect.top || wordRect.bottom > containerRect.bottom) {
          wordEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }
  }, [currentTime, isPlaying, wordTimings, currentWordIndex]);

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentWordIndex(-1);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const togglePlayPause = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getWordColorClass = (word: WordAnalysis, isActive: boolean, isPast: boolean): string => {
    if (isActive) {
      return "bg-[var(--accent-blue)] text-white px-1 rounded";
    }
    if (isPast) {
      switch (word.speed) {
        case "Ideal":
          return "text-green-400";
        case "Fast":
          return "text-yellow-400";
        case "Too Fast":
        case "Too Slow":
          return "text-red-400";
        default:
          return "text-[var(--text-secondary)]";
      }
    }
    return "text-[var(--text-muted)]";
  };

  const skipBack = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        duration || totalDuration,
        audioRef.current.currentTime + 5
      );
    }
  };

  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border-primary)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-blue)]/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-[var(--accent-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </div>
          <span className="font-medium text-[var(--text-primary)]">Recording Playback</span>
        </div>

        {/* Playback Speed */}
        <div className="flex items-center gap-1">
          {[0.5, 0.75, 1, 1.25, 1.5].map((rate) => (
            <button
              key={rate}
              onClick={() => handlePlaybackRateChange(rate)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                playbackRate === rate
                  ? "bg-[var(--accent-blue)] text-white"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>

      {/* Karaoke Display */}
      <div
        ref={containerRef}
        className="p-6 max-h-64 overflow-y-auto"
      >
        <div className="flex flex-wrap gap-1 leading-loose text-lg">
          {wordAnalysis.map((word, index) => {
            const isActive = index === currentWordIndex;
            const isPast = index < currentWordIndex;

            return (
              <span
                key={index}
                ref={(el) => { wordRefs.current[index] = el; }}
                className={`transition-all duration-150 ${getWordColorClass(word, isActive, isPast)} ${
                  isActive ? "scale-110 font-semibold" : ""
                }`}
              >
                {word.word}
              </span>
            );
          })}
        </div>

        {wordAnalysis.length === 0 && (
          <p className="text-[var(--text-secondary)] text-center py-8">
            {transcription || "No transcription available"}
          </p>
        )}
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-t border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
        <div className="flex items-center justify-center gap-4 text-xs text-[var(--text-tertiary)]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-blue)]"></span>
            Current
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
            Ideal pace
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
            Fast
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            Too slow/fast
          </span>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="p-4 border-t border-[var(--border-primary)]">
        {/* Progress Bar */}
        <div className="mb-4">
          <input
            type="range"
            min="0"
            max={duration || totalDuration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-[var(--bg-tertiary)] rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-[var(--accent-blue)]
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:shadow-lg
              [&::-webkit-slider-thumb]:shadow-[var(--accent-blue)]/30"
            style={{
              background: `linear-gradient(to right, var(--accent-blue) 0%, var(--accent-blue) ${
                ((currentTime / (duration || totalDuration || 1)) * 100)
              }%, var(--bg-tertiary) ${
                ((currentTime / (duration || totalDuration || 1)) * 100)
              }%, var(--bg-tertiary) 100%)`,
            }}
          />
          <div className="flex justify-between text-xs text-[var(--text-tertiary)] mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration || totalDuration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-4">
          {/* Skip Back */}
          <button
            onClick={skipBack}
            className="p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            title="Skip back 5 seconds"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
            </svg>
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlayPause}
            className="p-4 rounded-full bg-[var(--accent-blue)] text-white hover:bg-[var(--accent-blue-hover)] transition-colors shadow-lg shadow-[var(--accent-blue)]/30"
          >
            {isPlaying ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>

          {/* Skip Forward */}
          <button
            onClick={skipForward}
            className="p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            title="Skip forward 5 seconds"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  );
}
