import TournamentStatePanel from "./TournamentStatePanel";

type TournamentEmptyStateProps = {
  title: string;
};

export default function TournamentEmptyState({
  title,
}: TournamentEmptyStateProps) {
  return <TournamentStatePanel mode="empty" title={title} />;
}
