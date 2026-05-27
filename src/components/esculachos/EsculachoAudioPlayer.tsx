"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const AudioPlayerComplete = dynamic(
  () =>
    import("@/components/ui/audio-player-eleven").then(
      (mod) => mod.AudioPlayerComplete
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-10 w-full" />,
  }
);

interface EsculachoAudioPlayerProps {
  audioUrl: string;
  titulo: string;
  esculachoId: string;
}

export function EsculachoAudioPlayer({
  audioUrl,
  titulo,
  esculachoId,
}: EsculachoAudioPlayerProps) {
  return (
    <div className="w-full space-y-2">
      <AudioPlayerComplete
        item={{
          id: esculachoId,
          src: audioUrl,
        }}
        className="w-full"
        showSpeedControl={true}
      />
      <Button variant="outline" size="sm" className="w-full" asChild>
        <a
          href={audioUrl}
          download={`${titulo.replace(/[^a-zA-Z0-9]/g, "_")}.wav`}
        >
          <Download className="mr-2 h-4 w-4" />
          Baixar Áudio
        </a>
      </Button>
    </div>
  );
}
