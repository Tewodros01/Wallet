type KenoBetSelectorProps = {
  bets: readonly number[];
  value: number;
  disabled?: boolean;
  onChange: (bet: number) => void;
};

export default function KenoBetSelector({
  bets,
  value,
  disabled = false,
  onChange,
}: KenoBetSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
        Bet Amount
      </p>
      <div className="grid grid-cols-6 gap-1.5">
        {bets.map((bet) => (
          <button
            key={bet}
            type="button"
            onClick={() => onChange(bet)}
            disabled={disabled}
            className={`py-2 rounded-xl text-xs font-black transition-all ${
              value === bet
                ? "bg-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                : "bg-white/6 text-gray-400"
            }`}
          >
            {bet}
          </button>
        ))}
      </div>
    </div>
  );
}
