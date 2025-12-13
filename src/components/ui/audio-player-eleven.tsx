"use client"

import {
  ComponentProps,
  createContext,
  HTMLProps,
  ReactNode,
  RefObject,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { Check, PauseIcon, PlayIcon, Settings, Volume2, Volume1, VolumeX, RotateCcw } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

enum ReadyState {
  HAVE_NOTHING = 0,
  HAVE_METADATA = 1,
  HAVE_CURRENT_DATA = 2,
  HAVE_FUTURE_DATA = 3,
  HAVE_ENOUGH_DATA = 4,
}

enum NetworkState {
  NETWORK_EMPTY = 0,
  NETWORK_IDLE = 1,
  NETWORK_LOADING = 2,
  NETWORK_NO_SOURCE = 3,
}

function formatTime(seconds: number) {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00"
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

interface AudioPlayerItem<TData = unknown> {
  id: string | number
  src: string
  data?: TData
}

interface AudioPlayerApi<TData = unknown> {
  ref: RefObject<HTMLAudioElement | null>
  activeItem: AudioPlayerItem<TData> | null
  duration: number | undefined
  error: MediaError | null
  isPlaying: boolean
  isBuffering: boolean
  playbackRate: number
  isItemActive: (id: string | number | null) => boolean
  setActiveItem: (item: AudioPlayerItem<TData> | null) => Promise<void>
  play: (item?: AudioPlayerItem<TData> | null) => Promise<void>
  pause: () => void
  seek: (time: number) => void
  setPlaybackRate: (rate: number) => void
}

const AudioPlayerContext = createContext<AudioPlayerApi<unknown> | null>(null)

export function useAudioPlayer<TData = unknown>(): AudioPlayerApi<TData> {
  const api = useContext(AudioPlayerContext) as AudioPlayerApi<TData> | null
  if (!api) {
    throw new Error(
      "useAudioPlayer cannot be called outside of AudioPlayerProvider"
    )
  }
  return api
}

const AudioPlayerTimeContext = createContext<number | null>(null)

export const useAudioPlayerTime = () => {
  const time = useContext(AudioPlayerTimeContext)
  if (time === null) {
    throw new Error(
      "useAudioPlayerTime cannot be called outside of AudioPlayerProvider"
    )
  }
  return time
}

type Callback = (delta: number) => void

function useAnimationFrame(callback: Callback) {
  const requestRef = useRef<number | null>(null)
  const previousTimeRef = useRef<number | null>(null)
  const callbackRef = useRef<Callback>(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    const animate = (time: number) => {
      if (previousTimeRef.current !== null) {
        const delta = time - previousTimeRef.current
        callbackRef.current(delta)
      }
      previousTimeRef.current = time
      requestRef.current = requestAnimationFrame(animate)
    }

    requestRef.current = requestAnimationFrame(animate)

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
      previousTimeRef.current = null
    }
  }, [])
}

export function AudioPlayerProvider<TData = unknown>({
  children,
}: {
  children: ReactNode
}) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const itemRef = useRef<AudioPlayerItem<TData> | null>(null)
  const playPromiseRef = useRef<Promise<void> | null>(null)
  const [readyState, setReadyState] = useState<number>(0)
  const [networkState, setNetworkState] = useState<number>(0)
  const [time, setTime] = useState<number>(0)
  const [duration, setDuration] = useState<number | undefined>(undefined)
  const [error, setError] = useState<MediaError | null>(null)
  const [activeItem, _setActiveItem] = useState<AudioPlayerItem<TData> | null>(
    null
  )
  const [paused, setPaused] = useState(true)
  const [playbackRate, setPlaybackRateState] = useState<number>(1)

  const setActiveItem = useCallback(
    async (item: AudioPlayerItem<TData> | null) => {
      if (!audioRef.current) return

      if (item?.id === itemRef.current?.id) {
        return
      }
      itemRef.current = item
      const currentRate = audioRef.current.playbackRate
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      if (item === null) {
        audioRef.current.removeAttribute("src")
      } else {
        audioRef.current.src = item.src
      }
      audioRef.current.load()
      audioRef.current.playbackRate = currentRate
    },
    []
  )

  const play = useCallback(
    async (item?: AudioPlayerItem<TData> | null) => {
      if (!audioRef.current) return

      if (playPromiseRef.current) {
        try {
          await playPromiseRef.current
        } catch (error) {
          console.error("Play promise error:", error)
        }
      }

      if (item === undefined) {
        const playPromise = audioRef.current.play()
        playPromiseRef.current = playPromise
        return playPromise
      }
      if (item?.id === activeItem?.id) {
        const playPromise = audioRef.current.play()
        playPromiseRef.current = playPromise
        return playPromise
      }

      itemRef.current = item
      const currentRate = audioRef.current.playbackRate
      if (!audioRef.current.paused) {
        audioRef.current.pause()
      }
      audioRef.current.currentTime = 0
      if (item === null) {
        audioRef.current.removeAttribute("src")
      } else {
        audioRef.current.src = item.src
      }
      audioRef.current.load()
      audioRef.current.playbackRate = currentRate
      const playPromise = audioRef.current.play()
      playPromiseRef.current = playPromise
      return playPromise
    },
    [activeItem]
  )

  const pause = useCallback(async () => {
    if (!audioRef.current) return

    if (playPromiseRef.current) {
      try {
        await playPromiseRef.current
      } catch (e) {
        console.error(e)
      }
    }

    audioRef.current.pause()
    playPromiseRef.current = null
  }, [])

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = time
  }, [])

  const setPlaybackRate = useCallback((rate: number) => {
    if (!audioRef.current) return
    audioRef.current.playbackRate = rate
    setPlaybackRateState(rate)
  }, [])

  const isItemActive = useCallback(
    (id: string | number | null) => {
      return activeItem?.id === id
    },
    [activeItem]
  )

  useAnimationFrame(() => {
    if (audioRef.current) {
      _setActiveItem(itemRef.current)
      setReadyState(audioRef.current.readyState)
      setNetworkState(audioRef.current.networkState)
      setTime(audioRef.current.currentTime)
      setDuration(audioRef.current.duration)
      setPaused(audioRef.current.paused)
      setError(audioRef.current.error)
      setPlaybackRateState(audioRef.current.playbackRate)
    }
  })

  const isPlaying = !paused
  const isBuffering =
    readyState < ReadyState.HAVE_FUTURE_DATA &&
    networkState === NetworkState.NETWORK_LOADING

  const api = useMemo<AudioPlayerApi<TData>>(
    () => ({
      ref: audioRef,
      duration,
      error,
      isPlaying,
      isBuffering,
      activeItem,
      playbackRate,
      isItemActive,
      setActiveItem,
      play,
      pause,
      seek,
      setPlaybackRate,
    }),
    [
      audioRef,
      duration,
      error,
      isPlaying,
      isBuffering,
      activeItem,
      playbackRate,
      isItemActive,
      setActiveItem,
      play,
      pause,
      seek,
      setPlaybackRate,
    ]
  )

  return (
    <AudioPlayerContext.Provider value={api as AudioPlayerApi<unknown>}>
      <AudioPlayerTimeContext.Provider value={time}>
        <audio ref={audioRef} className="hidden" crossOrigin="anonymous" />
        {children}
      </AudioPlayerTimeContext.Provider>
    </AudioPlayerContext.Provider>
  )
}

export const AudioPlayerProgress = ({
  ...otherProps
}: Omit<
  ComponentProps<typeof SliderPrimitive.Root>,
  "min" | "max" | "value"
>) => {
  const player = useAudioPlayer()
  const time = useAudioPlayerTime()
  const wasPlayingRef = useRef(false)

  return (
    <SliderPrimitive.Root
      {...otherProps}
      value={[time]}
      onValueChange={(vals) => {
        player.seek(vals[0])
        otherProps.onValueChange?.(vals)
      }}
      min={0}
      max={player.duration ?? 0}
      step={otherProps.step || 0.25}
      onPointerDown={(e) => {
        wasPlayingRef.current = player.isPlaying
        player.pause()
        otherProps.onPointerDown?.(e)
      }}
      onPointerUp={(e) => {
        if (wasPlayingRef.current) {
          player.play()
        }
        otherProps.onPointerUp?.(e)
      }}
      className={cn(
        "group/player relative flex h-4 touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        otherProps.className
      )}
      onKeyDown={(e) => {
        if (e.key === " ") {
          e.preventDefault()
          if (!player.isPlaying) {
            player.play()
          } else {
            player.pause()
          }
        }
        otherProps.onKeyDown?.(e)
      }}
      disabled={
        player.duration === undefined ||
        !Number.isFinite(player.duration) ||
        Number.isNaN(player.duration)
      }
    >
      <SliderPrimitive.Track className="bg-muted relative h-[4px] w-full grow overflow-hidden rounded-full">
        <SliderPrimitive.Range className="bg-primary absolute h-full" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className="relative flex h-0 w-0 items-center justify-center opacity-0 group-hover/player:opacity-100 focus-visible:opacity-100 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
        data-slot="slider-thumb"
      >
        <div className="bg-foreground absolute size-3 rounded-full" />
      </SliderPrimitive.Thumb>
    </SliderPrimitive.Root>
  )
}

export const AudioPlayerTime = ({
  className,
  ...otherProps
}: HTMLProps<HTMLSpanElement>) => {
  const time = useAudioPlayerTime()
  return (
    <span
      {...otherProps}
      className={cn("text-muted-foreground text-xs tabular-nums", className)}
    >
      {formatTime(time)}
    </span>
  )
}

export const AudioPlayerDuration = ({
  className,
  ...otherProps
}: HTMLProps<HTMLSpanElement>) => {
  const player = useAudioPlayer()
  return (
    <span
      {...otherProps}
      className={cn("text-muted-foreground text-xs tabular-nums", className)}
    >
      {player.duration !== null &&
      player.duration !== undefined &&
      !Number.isFinite(player.duration)
        ? formatTime(player.duration)
        : "--:--"}
    </span>
  )
}

interface SpinnerProps {
  className?: string
}

function Spinner({ className }: SpinnerProps) {
  return (
    <div
      className={cn(
        "border-muted border-t-foreground size-3.5 animate-spin rounded-full border-2",
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading</span>
    </div>
  )
}

interface PlayButtonProps extends React.ComponentProps<typeof Button> {
  playing: boolean
  onPlayingChange: (playing: boolean) => void
  loading?: boolean
}

const PlayButton = ({
  playing,
  onPlayingChange,
  className,
  onClick,
  loading,
  ...otherProps
}: PlayButtonProps) => {
  return (
    <Button
      {...otherProps}
      onClick={(e) => {
        onPlayingChange(!playing)
        onClick?.(e)
      }}
      className={cn("relative", className)}
      aria-label={playing ? "Pause" : "Play"}
      type="button"
    >
      {playing ? (
        <PauseIcon
          className={cn("size-4", loading && "opacity-0")}
          aria-hidden="true"
        />
      ) : (
        <PlayIcon
          className={cn("size-4", loading && "opacity-0")}
          aria-hidden="true"
        />
      )}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[inherit] backdrop-blur-xs">
          <Spinner />
        </div>
      )}
    </Button>
  )
}

export interface AudioPlayerButtonProps<TData = unknown>
  extends React.ComponentProps<typeof Button> {
  item?: AudioPlayerItem<TData>
}

export function AudioPlayerButton<TData = unknown>({
  item,
  ...otherProps
}: AudioPlayerButtonProps<TData>) {
  const player = useAudioPlayer<TData>()

  if (!item) {
    return (
      <PlayButton
        {...otherProps}
        playing={player.isPlaying}
        onPlayingChange={(shouldPlay) => {
          if (shouldPlay) {
            player.play()
          } else {
            player.pause()
          }
        }}
        loading={player.isBuffering && player.isPlaying}
      />
    )
  }

  return (
    <PlayButton
      {...otherProps}
      playing={player.isItemActive(item.id) && player.isPlaying}
      onPlayingChange={(shouldPlay) => {
        if (shouldPlay) {
          player.play(item)
        } else {
          player.pause()
        }
      }}
      loading={
        player.isItemActive(item.id) && player.isBuffering && player.isPlaying
      }
    />
  )
}

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const

export interface AudioPlayerSpeedProps
  extends React.ComponentProps<typeof Button> {
  speeds?: readonly number[]
}

export function AudioPlayerSpeed({
  speeds = PLAYBACK_SPEEDS,
  className,
  variant = "ghost",
  size = "icon",
  ...props
}: AudioPlayerSpeedProps) {
  const player = useAudioPlayer()
  const currentSpeed = player.playbackRate

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn(className)}
          aria-label="Velocidade de reprodução"
          {...props}
        >
          <Settings className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px]">
        {speeds.map((speed) => (
          <DropdownMenuItem
            key={speed}
            onClick={() => player.setPlaybackRate(speed)}
            className="flex items-center justify-between"
          >
            <span className={speed === 1 ? "" : "font-mono"}>
              {speed === 1 ? "Normal" : `${speed}x`}
            </span>
            {currentSpeed === speed && <Check className="size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Componente completo de player adaptado do Eleven Labs com mute e restart
export interface AudioPlayerCompleteProps<TData = unknown> {
  item: AudioPlayerItem<TData>
  className?: string
  showSpeedControl?: boolean
}

export function AudioPlayerComplete<TData = unknown>({
  item,
  className,
  showSpeedControl = false,
}: AudioPlayerCompleteProps<TData>) {
  const player = useAudioPlayer<TData>()
  const [volume, setVolume] = useState(1)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const volumeContainerRef = useRef<HTMLDivElement>(null)
  const isActive = player.isItemActive(item.id)
  const isPlaying = isActive && player.isPlaying

  // Sincronizar volume com o elemento de áudio
  useEffect(() => {
    if (player.ref.current) {
      player.ref.current.volume = volume
    }
  }, [volume, player.ref])

  // Fechar slider ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (volumeContainerRef.current && !volumeContainerRef.current.contains(event.target as Node)) {
        setShowVolumeSlider(false)
      }
    }
    
    if (showVolumeSlider) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showVolumeSlider])

  const handleVolumeChange = useCallback((values: number[]) => {
    const newVolume = values[0]
    setVolume(newVolume)
    if (player.ref.current) {
      player.ref.current.volume = newVolume
      player.ref.current.muted = newVolume === 0
    }
  }, [player.ref])

  const handleVolumeToggle = useCallback(() => {
    setShowVolumeSlider(prev => !prev)
  }, [])

  const handleRestart = useCallback(() => {
    if (!isActive) return
    player.seek(0)
    if (!isPlaying) {
      player.play(item)
    }
  }, [isActive, isPlaying, item, player])

  // Ícone de volume baseado no nível
  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2

  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-lg bg-muted/50", className)}>
      <AudioPlayerButton item={item} size="icon" className="h-10 w-10 shrink-0" />

      <div className="flex-1 flex items-center gap-2 min-w-0">
        {isActive ? (
          <>
            <AudioPlayerTime className="w-10 shrink-0" />
            <AudioPlayerProgress className="flex-1" />
            <AudioPlayerDuration className="w-10 shrink-0" />
          </>
        ) : (
          <div className="flex-1 flex items-center gap-2">
            <span className="text-xs text-muted-foreground tabular-nums w-10 shrink-0">0:00</span>
            <div className="flex-1 h-1 bg-muted rounded-full" />
            <span className="text-xs text-muted-foreground tabular-nums w-10 shrink-0">--:--</span>
          </div>
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={handleRestart}
        disabled={!isActive}
        aria-label="Reiniciar"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>

      {/* Controle de volume */}
      <div ref={volumeContainerRef} className="relative flex items-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={handleVolumeToggle}
          aria-label="Ajustar volume"
        >
          <VolumeIcon className="h-4 w-4" />
        </Button>
        
        {showVolumeSlider && (
          <div className="absolute right-0 bottom-full mb-2 p-2 bg-popover border rounded-md shadow-md z-50">
            <SliderPrimitive.Root
              value={[volume]}
              onValueChange={handleVolumeChange}
              min={0}
              max={1}
              step={0.05}
              orientation="vertical"
              className="relative flex w-4 h-24 touch-none select-none flex-col items-center"
            >
              <SliderPrimitive.Track className="relative w-1 h-full grow overflow-hidden rounded-full bg-muted">
                <SliderPrimitive.Range className="absolute w-full bg-primary" />
              </SliderPrimitive.Track>
              <SliderPrimitive.Thumb className="block h-3 w-3 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
            </SliderPrimitive.Root>
          </div>
        )}
      </div>

      {showSpeedControl && (
        <AudioPlayerSpeed size="icon" className="h-8 w-8 shrink-0" />
      )}
    </div>
  )
}
