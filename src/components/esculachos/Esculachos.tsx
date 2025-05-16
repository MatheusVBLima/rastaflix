"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Esculacho } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, PlayCircle, Square } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface EsculachosProps {
  initialEsculachos: Esculacho[];
}

export function Esculachos({ initialEsculachos }: EsculachosProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [availableVoices, setAvailableVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | undefined>(
    undefined
  );
  const [speakingEsculachoId, setSpeakingEsculachoId] = useState<string | null>(
    null
  );
  const [isLoadingVoices, setIsLoadingVoices] = useState(true);

  async function fetchEsculachosClientSide(): Promise<Esculacho[]> {
    return initialEsculachos;
  }

  const {
    data: esculachos,
    isLoading,
    error,
  } = useQuery<Esculacho[], Error>({
    queryKey: ["esculachos"],
    queryFn: fetchEsculachosClientSide,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        setSelectedVoiceURI(voices[0]?.voiceURI);
        setIsLoadingVoices(false);
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
    };
  }, []);

  const filteredEsculachos = useMemo(() => {
    if (!esculachos) {
      return [];
    }
    if (!searchTerm) {
      return esculachos;
    }
    return esculachos.filter(
      (esculacho) =>
        esculacho.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (esculacho.descricao &&
          esculacho.descricao
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        esculacho.conteudo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (esculacho.autor &&
          esculacho.autor.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, esculachos]);

  const handleSpeak = (esculacho: Esculacho) => {
    if (speakingEsculachoId === esculacho.id) {
      window.speechSynthesis.cancel();
      setSpeakingEsculachoId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(esculacho.conteudo);
    const selectedVoice = availableVoices.find(
      (v) => v.voiceURI === selectedVoiceURI
    );
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.onstart = () => setSpeakingEsculachoId(esculacho.id);
    utterance.onend = () => setSpeakingEsculachoId(null);
    utterance.onerror = () => {
      setSpeakingEsculachoId(null);
      console.error("Erro ao tentar reproduzir o áudio do esculacho.");
    };
    window.speechSynthesis.speak(utterance);
  };

  if (error) {
    return <p>Erro ao carregar esculachos: {error.message}</p>;
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          type="text"
          placeholder="Pesquisar esculachos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
          disabled={isLoading}
        />
        {availableVoices.length > 0 && (
          <Select
            value={selectedVoiceURI}
            onValueChange={setSelectedVoiceURI}
            disabled={isLoadingVoices || isLoading}
          >
            <SelectTrigger className="w-full sm:w-[280px]">
              <SelectValue
                placeholder={
                  isLoadingVoices ? "Carregando vozes..." : "Selecione uma voz"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {isLoadingVoices ? (
                <SelectItem value="loading" disabled>
                  Carregando...
                </SelectItem>
              ) : (
                availableVoices.map((voice) => (
                  <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                    {voice.name} ({voice.lang})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        )}
      </div>

      {!isLoading && filteredEsculachos.length === 0 && !searchTerm && (
        <p className="text-center text-gray-500 dark:text-gray-400">
          Nenhum esculacho encontrado.
        </p>
      )}
      {!isLoading && filteredEsculachos.length === 0 && searchTerm && (
        <p className="text-center text-gray-500 dark:text-gray-400">
          Nenhum esculacho encontrado para &quot;{searchTerm}&quot;.
        </p>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card
              key={`skeleton-${index}`}
              className="flex flex-col h-full overflow-hidden"
            >
              <Skeleton className="h-20 w-full" />
              <CardContent className="flex-grow p-4">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6 mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter className="p-4 pt-0 mt-auto">
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && esculachos && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEsculachos.map((esculacho) => (
            <Card key={esculacho.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{esculacho.titulo}</CardTitle>
                {esculacho.descricao && (
                  <CardDescription className="italic">
                    {esculacho.descricao}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm whitespace-pre-wrap">
                  {esculacho.conteudo}
                </p>
              </CardContent>
              <CardFooter className="flex flex-col items-start gap-2 pt-4">
                <div className="flex flex-wrap gap-2">
                  {esculacho.autor && (
                    <Badge variant="outline">Autor: {esculacho.autor}</Badge>
                  )}
                </div>
                <Button
                  onClick={() => handleSpeak(esculacho)}
                  className="w-full mt-2"
                  variant={
                    speakingEsculachoId === esculacho.id
                      ? "destructive"
                      : "default"
                  }
                >
                  {speakingEsculachoId === esculacho.id ? (
                    <>
                      <Square className="mr-2 h-4 w-4" /> Parar
                    </>
                  ) : (
                    <>
                      <PlayCircle className="mr-2 h-4 w-4" /> Ouvir Esculacho
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
