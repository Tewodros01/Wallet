import TournamentStatePanel from "./TournamentStatePanel";

type TournamentLoadingStateProps = {
  count?: number;
  cardHeightClassName?: string;
};

export default function TournamentLoadingState({
  count = 3,
  cardHeightClassName,
}: TournamentLoadingStateProps) {
  return (
    <TournamentStatePanel
      mode="loading"
      count={count}
      cardHeightClassName={cardHeightClassName}
    />
  );
}
