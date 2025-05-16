"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { bingoItems } from "@/data/bingo";

interface BingoCardProps {
  text: string;
  isChecked: boolean;
  onClick: () => void;
}

const BingoCard: React.FC<BingoCardProps> = ({ text, isChecked, onClick }) => {
  return (
    <div className="aspect-square relative">
      <motion.div
        className="w-full h-full absolute cursor-pointer"
        initial={{ rotateY: 0 }}
        animate={{
          rotateY: isChecked ? 180 : 0,
        }}
        transition={{
          duration: 0.6,
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
        onClick={onClick}
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        {/* Frente do card (não marcado) */}
        <div
          className="w-full h-full flex items-center justify-center text-center border-[0.5px] cursor-pointer absolute "
          style={{
            backfaceVisibility: "hidden",
          }}
        >
          <motion.span
            className="font-bold text-center text-xs sm:text-sm md:text-base px-1"
            whileHover={{ scale: 1.05 }}
          >
            {text}
          </motion.span>
        </div>

        {/* Verso do card (marcado) */}
        <div
          className="w-full h-full flex items-center justify-center text-center border-[0.5px]  cursor-pointer absolute bg-green-900"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <motion.span
            className="font-bold text-center text-xs sm:text-sm md:text-base px-1"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.3,
              type: "spring",
              stiffness: 400,
              damping: 10,
            }}
          >
            {text}
          </motion.span>
        </div>
      </motion.div>
    </div>
  );
};

const STORAGE_KEY = "bingo_rastafari";

export function Bingo() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);

  // Carregar estado do localStorage quando o componente montar
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        setCheckedItems(parsedState);
      } else {
        console.log("Nenhum estado anterior encontrado no localStorage");
      }
    } catch (error) {
      console.error("Erro ao carregar estado do localStorage:", error);
    } finally {
      setLoaded(true);
    }
  }, []);

  // Salvar estado no localStorage quando mudar
  useEffect(() => {
    // Só salva depois que o estado inicial foi carregado para não sobrescrever
    if (loaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedItems));
      } catch (error) {
        console.error("Erro ao salvar estado no localStorage:", error);
      }
    }
  }, [checkedItems, loaded]);

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => {
      const newState = {
        ...prev,
        [id]: !prev[id],
      };
      return newState;
    });
  };

  return (
    <div className="min-h-screen py-4 px-2 sm:py-6 sm:px-4 ">
      <motion.h1
        className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-8 text-center "
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Bingo Rastafari
      </motion.h1>

      <div className="max-w-lg sm:max-w-2xl md:max-w-3xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 border-[0.5px] ">
          {bingoItems.map((item) => (
            <BingoCard
              key={item.id}
              text={item.text}
              isChecked={!!checkedItems[item.id]}
              onClick={() => toggleItem(item.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
