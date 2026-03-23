import { FaCrown } from "react-icons/fa";
import { formatTournamentCompactNumber } from "../utils";

type TournamentPrizePoolBannerProps = {
  totalPrize?: number;
};

export default function TournamentPrizePoolBanner({
  totalPrize,
}: TournamentPrizePoolBannerProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-yellow-500/20 bg-linear-to-r from-yellow-500/20 to-orange-500/10 px-4 py-3">
      <FaCrown className="shrink-0 text-xl text-yellow-400" />
      <div>
        <p className="text-xs font-black text-white">Total Active Prize Pool</p>
        <p className="text-lg font-black text-yellow-300">
          {typeof totalPrize === "number"
            ? formatTournamentCompactNumber(totalPrize)
            : "—"}{" "}
          coins
        </p>
      </div>
    </div>
  );
}
