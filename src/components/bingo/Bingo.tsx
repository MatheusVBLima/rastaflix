"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { bingoItems } from "@/data/bingo";
import { Check, RotateCcw } from "lucide-react";

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
        {/* Front of card (unchecked) */}
        <div
          className="w-full h-full flex items-center justify-center text-center border border-border rounded-md shadow-sm bg-card text-card-foreground p-2 absolute"
          style={{
            backfaceVisibility: "hidden",
          }}
        >
          <motion.span
            className="font-medium text-center text-xs sm:text-sm md:text-base px-1"
            whileHover={{ scale: 1.05 }}
          >
            {text}
          </motion.span>
        </div>

        {/* Back of card (checked) */}
        <div
          className="w-full h-full flex items-center justify-center text-center border border-green-700/20 rounded-md shadow-md absolute bg-green-900 text-white p-2"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <motion.div
            className="flex flex-col items-center gap-1"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.3,
              type: "spring",
              stiffness: 400,
              damping: 10,
            }}
          >
            <Check className="w-4 h-4 opacity-80" />
            <span className="font-medium text-center text-xs sm:text-sm md:text-base px-1">
              {text}
            </span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

const STORAGE_KEY = "bingo_rastafari";

export function Bingo() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // Load state from localStorage when component mounts
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        setCheckedItems(parsedState);
      }
    } catch (error) {
      console.error("Error loading state from localStorage:", error);
    } finally {
      setLoaded(true);
    }
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    if (loaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedItems));

        // Calculate completion percentage
        const checkedCount = Object.values(checkedItems).filter(Boolean).length;
        const totalItems = bingoItems.length;
        setCompletionPercentage(Math.round((checkedCount / totalItems) * 100));
      } catch (error) {
        console.error("Error saving state to localStorage:", error);
      }
    }
  }, [checkedItems, loaded]);

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const resetBingo = () => {
    setCheckedItems({});
  };

  return (
    <div className="min-h-screen py-8 px-4 bg-background">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Bingo Rastafari
          </h1>
          <p className="text-muted-foreground mb-4">
            Marque os itens que você encontrar
          </p>

          {loaded && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-full bg-muted rounded-full h-2.5 sm:w-48">
                  <div
                    className="bg-green-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">
                  {completionPercentage}%
                </span>
              </div>

              <button
                onClick={resetBingo}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-sm font-medium transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reiniciar
              </button>
            </div>
          )}
        </motion.div>

        <AnimatePresence>
          {loaded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="bg-card rounded-lg shadow-md p-2 sm:p-4"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                {bingoItems.map((item) => (
                  <BingoCard
                    key={item.id}
                    text={item.text}
                    isChecked={!!checkedItems[item.id]}
                    onClick={() => toggleItem(item.id)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
