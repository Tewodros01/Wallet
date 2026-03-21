import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TournamentCard from "../features/tournaments/components/TournamentCard";
import TournamentEmptyState from "../features/tournaments/components/TournamentEmptyState";
import TournamentLeaderboardList from "../features/tournaments/components/TournamentLeaderboardList";
import TournamentJoinModal from "../features/tournaments/components/TournamentJoinModal";
import TournamentLoadingState from "../features/tournaments/components/TournamentLoadingState";
import TournamentPageHeader from "../features/tournaments/components/TournamentPageHeader";
import TournamentPrizePoolBanner from "../features/tournaments/components/TournamentPrizePoolBanner";
import {
  useJoinTournament,
  usePrizePool,
  useLeaderboard as useTournamentLeaderboard,
  useTournaments,
} from "../hooks/useTournaments";
import type { Tournament } from "../types/tournament.types";

type Filter = "all" | "UPCOMING" | "LIVE" | "FINISHED";
type MainTab = "tournaments" | "leaderboard";

export default function Tournament() {
  const navigate = useNavigate();
  const [joining, setJoining] = useState<Tournament | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [mainTab, setMainTab] = useState<MainTab>("tournaments");

  const { data: tournaments = [], isLoading } = useTournaments();
  const { data: prizePoolData } = usePrizePool();
  const { data: leaderboard = [], isLoading: lbLoading } =
    useTournamentLeaderboard();
  const { mutate: joinTournament, isPending } = useJoinTournament();

  const filtered =
    filter === "all"
      ? tournaments
      : tournaments.filter((t) => t.status === filter);
  const liveCount = tournaments.filter((t) => t.status === "LIVE").length;
  const upcomingCount = tournaments.filter(
    (t) => t.status === "UPCOMING",
  ).length;

  const handleConfirmJoin = () => {
    if (!joining) return;
    joinTournament(joining.id, { onSuccess: () => setJoining(null) });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <TournamentPageHeader
        liveCount={liveCount}
        upcomingCount={upcomingCount}
        mainTab={mainTab}
        filter={filter}
        onBack={() => navigate(-1)}
        onMainTabChange={setMainTab}
        onFilterChange={setFilter}
      />

      <div className="flex flex-col gap-4 px-5 py-4 pb-10">
        <TournamentPrizePoolBanner totalPrize={prizePoolData?.totalPrize} />

        {mainTab === "leaderboard" ? (
          <TournamentLeaderboardList
            leaderboard={leaderboard}
            loading={lbLoading}
          />
        ) : (
          <>
            {isLoading ? (
              <TournamentLoadingState />
            ) : filtered.length === 0 ? (
              <TournamentEmptyState title="No tournaments found" />
            ) : (
              <div className="flex flex-col gap-4">
                {filtered.map((t) => (
                  <TournamentCard
                    key={t.id}
                    tournament={t}
                    onJoin={setJoining}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {joining && (
        <TournamentJoinModal
          tournament={joining}
          onClose={() => setJoining(null)}
          onConfirm={handleConfirmJoin}
          loading={isPending}
        />
      )}
    </div>
  );
}
