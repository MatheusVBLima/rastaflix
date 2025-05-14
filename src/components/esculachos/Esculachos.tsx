"use client";

import React, { useState, useEffect, useMemo } from "react";
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

interface EsculachosProps {
  initialEsculachos: Esculacho[];
}

export function Esculachos({ initialEsculachos }: EsculachosProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [esculachos, setEsculachos] = useState<Esculacho[]>(initialEsculachos);
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

  // Carregar vozes disponíveis
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        setSelectedVoiceURI(voices[0]?.voiceURI); // Seleciona a primeira voz por padrão
        setIsLoadingVoices(false);
      }
    };

    loadVoices(); // Tenta carregar imediatamente
    window.speechSynthesis.onvoiceschanged = loadVoices; // E quando a lista mudar

    return () => {
      window.speechSynthesis.onvoiceschanged = null; // Limpa o listener
      window.speechSynthesis.cancel(); // Para qualquer fala ao desmontar
    };
  }, []);

  const filteredEsculachos = useMemo(() => {
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

  useEffect(() => {
    // Atualiza a lista de esculachos se initialEsculachos mudar (ex: após revalidação)
    setEsculachos(initialEsculachos);
  }, [initialEsculachos]);

  const handleSpeak = (esculacho: Esculacho) => {
    if (speakingEsculachoId === esculacho.id) {
      window.speechSynthesis.cancel();
      setSpeakingEsculachoId(null);
      return;
    }

    window.speechSynthesis.cancel(); // Cancela qualquer fala anterior
    const utterance = new SpeechSynthesisUtterance(esculacho.conteudo);
    const selectedVoice = availableVoices.find(
      (v) => v.voiceURI === selectedVoiceURI
    );

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      setSpeakingEsculachoId(esculacho.id);
    };
    utterance.onend = () => {
      setSpeakingEsculachoId(null);
    };
    utterance.onerror = () => {
      setSpeakingEsculachoId(null);
      console.error("Erro ao tentar reproduzir o áudio do esculacho.");
      // Adicionar um toast de erro aqui seria uma boa ideia
    };

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          type="text"
          placeholder="Pesquisar esculachos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        {availableVoices.length > 0 && (
          <Select value={selectedVoiceURI} onValueChange={setSelectedVoiceURI}>
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

      {filteredEsculachos.length === 0 && !searchTerm && (
        <p className="text-center text-gray-500 dark:text-gray-400">
          Nenhum esculacho encontrado.
        </p>
      )}
      {filteredEsculachos.length === 0 && searchTerm && (
        <p className="text-center text-gray-500 dark:text-gray-400">
          Nenhum esculacho encontrado para &quot;{searchTerm}&quot;.
        </p>
      )}

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
    </div>
  );
}
