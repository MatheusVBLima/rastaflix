"use client";

import * as React from "react";
import { Play, Pause, Volume2, VolumeX, RotateCcw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

interface AudioPlayerProps {
  src: string;
  className?: string;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function AudioPlayer({ src, className }: AudioPlayerProps) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [isMuted, setIsMuted] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Resetar estado quando src mudar
  React.useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsLoading(true);
    setError(null);
  }, [src]);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Resetar áudio quando src mudar
    audio.load();

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      setError(null);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (e: Event) => {
      const audioElement = e.target as HTMLAudioElement;
      const errorCode = audioElement.error?.code;
      let errorMessage = "Erro ao carregar áudio";
      
      if (errorCode === 4) {
        errorMessage = "Formato de áudio não suportado";
      } else if (errorCode === 3) {
        errorMessage = "Erro ao decodificar áudio";
      } else if (errorCode === 2) {
        errorMessage = "Erro de rede ao carregar áudio";
      }
      
      console.error("Erro no áudio:", errorCode, audioElement.error);
      setError(errorMessage);
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setError(null);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [src]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        // Estado será atualizado pelo listener handlePause
      } else {
        await audio.play();
        // Estado será atualizado pelo listener handlePlay
      }
    } catch (error) {
      console.error("Erro ao reproduzir áudio:", error);
      setError("Erro ao reproduzir áudio");
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleRestart = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    setCurrentTime(0);
    if (!isPlaying) {
      try {
        await audio.play();
        // Estado será atualizado pelo listener handlePlay
      } catch (error) {
        console.error("Erro ao reiniciar áudio:", error);
        setError("Erro ao reiniciar áudio");
      }
    }
  };

  if (error) {
    return (
      <div className={cn("flex items-center justify-center p-3 rounded-lg bg-muted/50", className)}>
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </Badge>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-lg bg-muted/50", className)}>
      <audio ref={audioRef} src={src} preload="metadata" />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-10 w-10 shrink-0"
        onClick={togglePlay}
        disabled={isLoading}
      >
        {isPlaying ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5" />
        )}
      </Button>

      <div className="flex-1 flex items-center gap-2 min-w-0">
        <span className="text-xs text-muted-foreground tabular-nums w-10 shrink-0">
          {formatTime(currentTime)}
        </span>

        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSeek}
          className="flex-1"
          disabled={isLoading}
        />

        <span className="text-xs text-muted-foreground tabular-nums w-10 shrink-0">
          {formatTime(duration)}
        </span>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={handleRestart}
        disabled={isLoading}
      >
        <RotateCcw className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={toggleMute}
        disabled={isLoading}
      >
        {isMuted ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

export { AudioPlayer };
