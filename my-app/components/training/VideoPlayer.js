"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const PROGRESS_REPORT_INTERVAL_MS = 10000; // Report progress every 10 seconds

export default function VideoPlayer({
  videoUrl,
  transcript,
  initialPosition = 0,
  initialProgress = 0,
  videoCompleted = false,
  onProgressUpdate,
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const lastReportedRef = useRef(initialProgress);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(initialProgress);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showTranscript, setShowTranscript] = useState(false);
  const [completed, setCompleted] = useState(videoCompleted);
  const [hasVideo, setHasVideo] = useState(!!videoUrl);

  // Report progress to parent
  const reportProgress = useCallback(
    (videoProgress, position) => {
      if (
        onProgressUpdate &&
        Math.abs(videoProgress - lastReportedRef.current) >= 2
      ) {
        lastReportedRef.current = videoProgress;
        onProgressUpdate({
          videoProgress: Math.round(videoProgress),
          lastWatchedPosition: Math.round(position),
        });
      }
    },
    [onProgressUpdate]
  );

  // Time update handler
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let intervalId = null;

    const onTimeUpdate = () => {
      const time = video.currentTime;
      const dur = video.duration || 1;
      const pct = Math.min((time / dur) * 100, 100);

      setCurrentTime(time);
      setProgress(pct);

      if (pct >= 90 && !completed) {
        setCompleted(true);
      }
    };

    const onLoadedMetadata = () => {
      setDuration(video.duration);
      if (initialPosition > 0 && video.duration > 0) {
        video.currentTime = Math.min(initialPosition, video.duration - 1);
      }
    };

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      const pct = 100;
      setProgress(pct);
      if (!completed) setCompleted(true);
      reportProgress(pct, video.duration);
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);

    // Periodic progress reporting
    intervalId = setInterval(() => {
      if (!video.paused && video.duration > 0) {
        const pct = Math.min(
          (video.currentTime / video.duration) * 100,
          100
        );
        reportProgress(pct, video.currentTime);
      }
    }, PROGRESS_REPORT_INTERVAL_MS);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
      if (intervalId) clearInterval(intervalId);
    };
  }, [initialPosition, completed, reportProgress]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  const cycleSpeed = () => {
    const video = videoRef.current;
    if (!video) return;
    const idx = PLAYBACK_SPEEDS.indexOf(speed);
    const next = PLAYBACK_SPEEDS[(idx + 1) % PLAYBACK_SPEEDS.length];
    video.playbackRate = next;
    setSpeed(next);
  };

  const seek = (e) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    video.currentTime = pct * video.duration;
  };

  const restart = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play();
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // No video URL — show placeholder
  if (!hasVideo) {
    return (
      <div className="space-y-4">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted flex items-center justify-center">
          <div className="text-center space-y-2 p-6">
            <Play className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">
              Video content is being prepared
            </p>
            <p className="text-xs text-muted-foreground/70">
              The training video will be available here once uploaded. You can
              still proceed to the quiz below.
            </p>
          </div>
        </div>

        {/* Completion indicator */}
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span className="text-muted-foreground">
            Video not required (content pending upload)
          </span>
        </div>

        {/* Transcript */}
        {transcript && (
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTranscript(!showTranscript)}
              className="gap-1.5"
            >
              <FileText className="h-3.5 w-3.5" />
              {showTranscript ? "Hide" : "Show"} Transcript
            </Button>
            {showTranscript && (
              <div className="mt-3 max-h-60 overflow-y-auto rounded-md border bg-muted/50 p-4 text-sm leading-relaxed text-muted-foreground">
                {transcript}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Video container */}
      <div
        ref={containerRef}
        className="relative aspect-video w-full overflow-hidden rounded-lg bg-black"
      >
        <video
          ref={videoRef}
          src={videoUrl}
          className="h-full w-full object-contain"
          playsInline
          onClick={togglePlay}
        />

        {/* Center play overlay */}
        {!playing && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity hover:bg-black/30"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg">
              <Play className="h-7 w-7 text-gray-900 ml-1" />
            </div>
          </button>
        )}

        {/* Controls bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
          {/* Seek bar */}
          <div
            className="group mb-2 h-1 w-full cursor-pointer rounded-full bg-white/30 transition-all hover:h-2"
            onClick={seek}
          >
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
              >
                {playing ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={restart}
                className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
              >
                {muted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <span className="ml-2 text-xs tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={cycleSpeed}
                className="rounded px-2 py-1 text-xs font-medium hover:bg-white/20"
              >
                {speed}x
              </button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress info below video */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {completed ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-green-600 dark:text-green-400 font-medium">
                Video complete
              </span>
            </>
          ) : (
            <>
              <span className="text-muted-foreground">
                Watch at least 90% to continue
              </span>
            </>
          )}
        </div>
        <span className="tabular-nums text-muted-foreground">
          {Math.round(progress)}% watched
        </span>
      </div>
      <Progress value={progress} className="h-1.5" />

      {/* Transcript toggle */}
      {transcript && (
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTranscript(!showTranscript)}
            className="gap-1.5"
          >
            <FileText className="h-3.5 w-3.5" />
            {showTranscript ? "Hide" : "Show"} Transcript
          </Button>
          {showTranscript && (
            <div className="mt-3 max-h-60 overflow-y-auto rounded-md border bg-muted/50 p-4 text-sm leading-relaxed text-muted-foreground">
              {transcript}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
