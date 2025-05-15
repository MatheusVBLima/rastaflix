"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { historias } from "@/data/dle";
import confetti from "canvas-confetti";
import { useEffect, useRef, useState } from "react";
import { CheckCircle, XCircle, Trophy, Clock } from "lucide-react";
import { Badge } from "../ui/badge";
import twemoji from "twemoji";

type VerificarPalpiteType =
  | "Verificar"
  | "Jogar Novamente"
  | "Fim das histórias";
type TentativasPorFase = Record<number, number>;

export function DLE() {
  const [historiaAtual, setHistoriaAtual] = useState(0);
  const [emojisVisiveis, setEmojisVisiveis] = useState(1);
  const [palpite, setPalpite] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [tentativas, setTentativas] = useState<string[]>([]);
  const [acertou, setAcertou] = useState(false);
  const [tentativasCorretas, setTentativasCorretas] = useState<string[]>([]);
  const [botaoVerificarPalpite, setBotaoVerificarPalpite] =
    useState<VerificarPalpiteType>("Verificar");
  const [tentativasPorFase, setTentativasPorFase] = useState<TentativasPorFase>(
    {}
  );
  const [fasesCompletas, setFasesCompletas] = useState<number[]>([]);
  const [emojisReveladosPorFase, setEmojisReveladosPorFase] = useState<
    Record<number, number>
  >({});
  const botaoRef = useRef<HTMLButtonElement>(null);
  const emojiContainerRef = useRef<HTMLDivElement>(null);
  const placardoRef = useRef<HTMLDivElement>(null);

  // Função para aplicar Twemoji a um elemento
  const aplicarTwemoji = (elemento: HTMLElement | null) => {
    if (elemento) {
      twemoji.parse(elemento, {
        folder: "svg",
        ext: ".svg",
        className: "emoji",
      });
    }
  };

  // Aplicar Twemoji aos emojis quando eles mudarem
  useEffect(() => {
    aplicarTwemoji(emojiContainerRef.current);
    aplicarTwemoji(placardoRef.current);
  }, [emojisVisiveis, historiaAtual, fasesCompletas]);

  useEffect(() => {
    if (botaoVerificarPalpite === "Jogar Novamente" && botaoRef.current) {
      botaoRef.current.focus();
    }
  }, [botaoVerificarPalpite]);

  const resetarJogo = () => {
    const novoIndice = (historiaAtual + 1) % historias.length;
    setHistoriaAtual(novoIndice);
    setEmojisVisiveis(1);
    setPalpite("");
    setMensagem("");
    setTentativas([]);
    setAcertou(false);
    setBotaoVerificarPalpite("Verificar");
    setTentativasCorretas([]);
  };

  const verificarPalpite = () => {
    if (botaoVerificarPalpite === "Jogar Novamente") {
      resetarJogo();
      return;
    }

    if (botaoVerificarPalpite === "Fim das histórias") {
      return;
    }

    const removerAcentuacao = (str: string) => {
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    const palpiteSemAcentuacao = removerAcentuacao(palpite.toLowerCase());
    const palavrasPalpite = palpiteSemAcentuacao.split(/\s+/);

    const acertou = historias[historiaAtual].palavrasChave?.some((subarray) =>
      subarray.every((palavra) =>
        palavrasPalpite.includes(removerAcentuacao(palavra.toLowerCase()))
      )
    );

    if (acertou) {
      setMensagem("Parabéns! Você acertou!");
      setAcertou(true);
      setTentativasCorretas([...tentativasCorretas, palpite]);
      setBotaoVerificarPalpite(
        historiaAtual === historias.length - 1
          ? "Fim das histórias"
          : "Jogar Novamente"
      );

      // Atualizar tentativas por fase e fases completas
      const tentativasAtuais = tentativas.length + 1; // +1 para contar a tentativa correta
      setTentativasPorFase((prev) => ({
        ...prev,
        [historiaAtual]: tentativasAtuais,
      }));
      setEmojisReveladosPorFase((prev) => ({
        ...prev,
        [historiaAtual]: emojisVisiveis,
      }));

      if (!fasesCompletas.includes(historiaAtual)) {
        setFasesCompletas((prev) => [...prev, historiaAtual]);
      }

      confetti();
    } else {
      setMensagem("Tente novamente!");
      setBotaoVerificarPalpite("Verificar");
      if (emojisVisiveis < 5) {
        setEmojisVisiveis(emojisVisiveis + 1);
      }

      setTentativas([...tentativas, palpite]);
    }
    setPalpite("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Card do Jogo - Ocupa 2/3 do espaço em telas grandes */}
      <Card className="lg:col-span-2 ">
        <CardHeader className="flex flex-col gap-2 items-center">
          <CardTitle className="text-2xl font-bold text-center">
            Qual história é descrita por esses emojis?
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Cada resposta contém pelo menos 2 palavras
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 items-center">
          <div className="flex justify-center mb-4 text-5xl">
            {historias[historiaAtual].emojis
              .slice(0, emojisVisiveis)
              .map((emoji, index) => (
                <span key={index} className="mx-2 animate-pulse">
                  {emoji}
                </span>
              ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (botaoVerificarPalpite === "Verificar") {
                verificarPalpite();
              } else if (botaoVerificarPalpite === "Jogar Novamente") {
                resetarJogo();
              }
            }}
            className="max-w-96 w-full flex flex-col gap-4"
          >
            <Input
              type="text"
              value={botaoVerificarPalpite === "Verificar" ? palpite : ""}
              onChange={(e) => setPalpite(e.target.value)}
              placeholder="Digite o nome da história"
              disabled={botaoVerificarPalpite !== "Verificar"}
            />
            <Button
              type="submit"
              className={`w-full px-4 py-2 font-bold cursor-pointer ${
                botaoVerificarPalpite === "Jogar Novamente"
                  ? "bg-green-600 hover:bg-green-700"
                  : ""
              }`}
              ref={botaoRef}
            >
              {botaoVerificarPalpite}
            </Button>
          </form>
          {mensagem && (
            <p
              className={`mt-4 font-bold text-center ${
                acertou ? "text-green-500" : "text-yellow-500"
              }`}
            >
              {mensagem}
            </p>
          )}
          {acertou && (
            <div className="mt-4 rounded-lg overflow-hidden border border-gray-700 ">
              <iframe
                width="580"
                height="315"
                src={historias[historiaAtual].iframe}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="w-[300px] h-[225px] md:w-[580px] md:h-[315px]"
              />
            </div>
          )}

          <div className="flex flex-col w-full mt-6">
            {(tentativas.length > 0 || tentativasCorretas.length > 0) && (
              <div className="grid grid-cols-1 gap-3 w-full">
                <div className="flex flex-col gap-2">
                  {tentativasCorretas.map((tentativa, index) => (
                    <div
                      key={`correct-${index}`}
                      className="flex items-center p-3 rounded-lg bg-green-100 border border-green-300 text-green-800"
                    >
                      <div className="mr-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <p className="font-medium">{tentativa}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2">
                  {tentativas
                    .slice()
                    .reverse()
                    .map((tentativa, index) => (
                      <div
                        key={`wrong-${index}`}
                        className="flex items-center p-3 rounded-lg bg-red-100 border border-red-300 text-red-800"
                      >
                        <div className="mr-3">
                          <XCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <p className="font-medium">{tentativa}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card de Placar - Ocupa 1/3 do espaço em telas grandes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Placar
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Seu progresso no jogo
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Card className=" p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">Progresso</h3>
              <Badge>
                {fasesCompletas.length}/{historias.length}
              </Badge>
            </div>
            <div className="w-full bg-primary/20 rounded-full h-2.5">
              <div
                className="bg-primary h-2.5 rounded-full"
                style={{
                  width: `${(fasesCompletas.length / historias.length) * 100}%`,
                }}
              ></div>
            </div>
          </Card>

          <div>
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Tentativas por Fase
              </h3>
              <div className="space-y-4">
                {historias.map((historia, index) => {
                  const isFaseAtual = index === historiaAtual;
                  const isFaseCompleta = fasesCompletas.includes(index);
                  const isFaseFutura =
                    !isFaseCompleta && index !== historiaAtual;

                  return (
                    <Card key={index} className="p-3 rounded-lg gap-0">
                      <CardHeader className="p-0 mb-2">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full border flex items-center justify-center mr-2 text-muted-foreground">
                              {index + 1}
                            </div>
                            <span className="text-sm font-medium">
                              {isFaseAtual
                                ? "Fase Atual"
                                : isFaseCompleta
                                ? "Completada"
                                : "Não iniciada"}
                            </span>
                          </div>
                          <div className="flex items-center">
                            {isFaseCompleta ? (
                              <div className="flex items-center">
                                <span className="text-sm mr-2">
                                  {tentativasPorFase[index] || 0} tentativas
                                </span>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              </div>
                            ) : isFaseAtual ? (
                              <Badge className="text-sm text-yellow-600 bg-yellow-200 border ring-yellow-600">
                                Em andamento
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                Bloqueada
                              </span>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0 mt-2">
                        <div className="flex justify-center space-x-2">
                          {isFaseAtual
                            ? // Mostrar apenas os emojis revelados na fase atual
                              historia.emojis
                                .slice(0, emojisVisiveis)
                                .map((emoji, emojiIndex) => (
                                  <span key={emojiIndex} className="text-2xl">
                                    {emoji}
                                  </span>
                                ))
                            : isFaseCompleta
                            ? // Mostrar apenas os emojis que foram revelados quando o usuário acertou
                              historia.emojis
                                .slice(0, emojisReveladosPorFase[index] || 5)
                                .map((emoji, emojiIndex) => (
                                  <span key={emojiIndex} className="text-2xl">
                                    {emoji}
                                  </span>
                                ))
                            : // Mostrar todos os emojis com blur para fases futuras
                              historia.emojis.map((emoji, emojiIndex) => (
                                <span
                                  key={emojiIndex}
                                  className="text-2xl filter blur-sm opacity-50"
                                >
                                  {emoji}
                                </span>
                              ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
