import { useState } from "react";
import { FaCheck } from "react-icons/fa";
import { IoMdCard } from "react-icons/io";
import Button from "../../components/ui/Button";
import { AppBar, Avatar, Pill } from "../../components/ui/Layout";
import { MiniCard, SAMPLE_CARDS } from "./bingoComponents";

interface Props {
  card: number[][] | null;       // real card from server (null = not assigned yet)
  onConfirm: () => void;
  onBack: () => void;
}

export default function CardSelector({ card, onConfirm, onBack }: Props) {
  const [selected, setSelected] = useState<number>(card ? 0 : -1);

  // If server gave us a real card, show only that one; otherwise show sample cards
  const cards = card
    ? [{ id: 0, board: card }]
    : SAMPLE_CARDS;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      <AppBar
        left={
          <div className="flex items-center gap-3">
            <button type="button" onClick={onBack} className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors">
              <span className="text-white text-sm">←</span>
            </button>
            <span className="text-base font-black">Your Card</span>
          </div>
        }
        right={
          <Pill icon={<IoMdCard className="text-violet-400" />} className="text-violet-300">
            {card ? "Assigned" : "Pick One"}
          </Pill>
        }
      />

      <div className="flex flex-col gap-4 px-5 py-5 flex-1">
        <div>
          <h1 className="text-2xl font-black text-white">
            {card ? "Your Assigned Card" : "Pick Your Card"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {card ? "This card was assigned to you by the server" : "Select one card before the game starts"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 flex-1 content-start">
          {cards.map((c) => {
            const sel = selected === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelected(c.id)}
                className={`relative rounded-2xl p-3 text-left transition-all active:scale-95 overflow-hidden border-2 ${sel ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.25)]" : "border-white/[0.08] bg-white/[0.03] hover:border-white/20"}`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-bold text-gray-400">Card #{c.id + 1}</span>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all ${sel ? "bg-emerald-500 border-emerald-500" : "border-white/20"}`}>
                    {sel && <FaCheck className="text-white text-[8px]" />}
                  </div>
                </div>
                <MiniCard board={c.board} />
              </button>
            );
          })}
        </div>

        <Button size="lg" disabled={selected === -1} onClick={onConfirm}>
          {selected !== -1 ? "Play with This Card" : "Select a Card to Continue"}
        </Button>
      </div>
    </div>
  );
}
