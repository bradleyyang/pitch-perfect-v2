"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface AudioRecorderProps {
  onRecordingComplete: (file: File, audioUrl: string) => void;
  disabled?: boolean;
}

export function AudioRecorder({ onRecordingComplete, disabled }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const updateAudioLevel = useCallback(() => {
    if (analyserRef.current && isRecording && !isPaused) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average / 255);
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  }, [isRecording, isPaused]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      streamRef.current = stream;
      setPermissionDenied(false);

      // Set up audio analyser for visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Create MediaRecorder - try supported formats in order of preference
      // Backend accepts: audio/webm, video/webm, video/mp4, audio/mpeg, audio/mp3, audio/wav
      let mimeType = "audio/webm";
      if (!MediaRecorder.isTypeSupported("audio/webm")) {
        if (MediaRecorder.isTypeSupported("video/webm")) {
          mimeType = "video/webm";
        } else if (MediaRecorder.isTypeSupported("video/mp4")) {
          mimeType = "video/mp4";
        } else if (MediaRecorder.isTypeSupported("audio/mpeg")) {
          mimeType = "audio/mpeg";
        } else {
          // Fallback to default if none supported
          mimeType = "";
        }
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType || undefined,
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Use the actual MIME type from MediaRecorder, but ensure it's compatible with backend
        // Backend accepts: audio/mpeg, audio/mp3, audio/wav, video/mp4, audio/webm, video/webm
        const recordedMimeType = mediaRecorder.mimeType || "";
        let fileMimeType = recordedMimeType;
        let extension = "webm";

        // Map MIME types to backend-compatible ones
        if (recordedMimeType.includes("webm")) {
          // Prefer audio/webm if it starts with audio/, otherwise video/webm
          fileMimeType = recordedMimeType.startsWith("audio/") ? "audio/webm" : "video/webm";
          extension = "webm";
        } else if (recordedMimeType.includes("mp4")) {
          // Backend accepts video/mp4 but NOT audio/mp4, so always use video/mp4 for mp4
          fileMimeType = "video/mp4";
          extension = "mp4";
        } else if (recordedMimeType.includes("mpeg") || recordedMimeType.includes("mp3")) {
          fileMimeType = "audio/mpeg";
          extension = "mp3";
        } else if (recordedMimeType.includes("wav")) {
          fileMimeType = "audio/wav";
          extension = "wav";
        } else {
          // Default fallback to audio/webm (most common supported format)
          fileMimeType = "audio/webm";
          extension = "webm";
        }

        const audioBlob = new Blob(audioChunksRef.current, {
          type: fileMimeType
        });

        // Convert to File object with backend-compatible MIME type
        const fileName = `recording-${Date.now()}.${extension}`;
        const file = new File([audioBlob], fileName, { type: fileMimeType });
        const audioUrl = URL.createObjectURL(audioBlob);

        onRecordingComplete(file, audioUrl);

        // Clean up stream
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Start audio level visualization
      updateAudioLevel();

    } catch (error) {
      console.error("Error accessing microphone:", error);
      setPermissionDenied(true);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        timerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
        updateAudioLevel();
      } else {
        mediaRecorderRef.current.pause();
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      }
      setIsPaused(!isPaused);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      setAudioLevel(0);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      audioChunksRef.current = [];
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    setAudioLevel(0);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  if (permissionDenied) {
    return (
      <div className="p-4 rounded-xl bg-[var(--error-subtle)] border border-[var(--error)]/30">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-[var(--error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-[var(--error)]">Microphone access denied</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              Please allow microphone access in your browser settings to record audio.
            </p>
          </div>
        </div>
        <button
          onClick={() => setPermissionDenied(false)}
          className="mt-3 text-sm text-[var(--accent-blue)] hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Recording Controls */}
      {!isRecording ? (
        <button
          onClick={startRecording}
          disabled={disabled}
          className={`
            w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl
            transition-all duration-200 font-medium
            ${disabled
              ? "bg-[var(--bg-tertiary)] text-[var(--text-muted)] cursor-not-allowed"
              : "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border border-[var(--accent-blue)]/30 hover:bg-[var(--accent-blue)]/20 hover:border-[var(--accent-blue)]/50"
            }
          `}
        >
          <div className="w-10 h-10 rounded-full bg-[var(--accent-blue)] flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </div>
          <span>Start Recording</span>
        </button>
      ) : (
        <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
          {/* Recording Indicator & Timer */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isPaused ? "bg-yellow-400" : "bg-red-500 animate-pulse"}`} />
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {isPaused ? "Paused" : "Recording"}
              </span>
            </div>
            <div className="text-2xl font-mono font-semibold text-[var(--text-primary)]">
              {formatTime(recordingTime)}
            </div>
          </div>

          {/* Audio Level Visualization */}
          <div className="h-12 mb-4 flex items-center justify-center gap-1">
            {Array.from({ length: 20 }).map((_, i) => {
              const threshold = (i + 1) / 20;
              const isActive = audioLevel >= threshold && !isPaused;
              return (
                <div
                  key={i}
                  className={`w-2 rounded-full transition-all duration-75 ${
                    isActive
                      ? "bg-[var(--accent-blue)]"
                      : "bg-[var(--border-secondary)]"
                  }`}
                  style={{
                    height: `${20 + (i * 1.5)}px`,
                    opacity: isActive ? 1 : 0.3,
                  }}
                />
              );
            })}
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-3">
            {/* Cancel Button */}
            <button
              onClick={cancelRecording}
              className="p-3 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--error)] transition-colors"
              title="Cancel"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Pause/Resume Button */}
            <button
              onClick={pauseRecording}
              className="p-3 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--accent-blue)] transition-colors"
              title={isPaused ? "Resume" : "Pause"}
            >
              {isPaused ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              )}
            </button>

            {/* Stop Button */}
            <button
              onClick={stopRecording}
              className="p-4 rounded-full bg-[var(--accent-blue)] text-white hover:bg-[var(--accent-blue-hover)] transition-colors shadow-lg shadow-[var(--accent-blue)]/30"
              title="Stop & Save"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2"/>
              </svg>
            </button>
          </div>

          <p className="text-xs text-[var(--text-muted)] text-center mt-3">
            Click the square button to stop and save your recording
          </p>
        </div>
      )}
    </div>
  );
}
