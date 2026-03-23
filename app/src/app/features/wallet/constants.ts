import type { IconType } from "react-icons";
import { FaArrowDown, FaArrowUp, FaExchangeAlt } from "react-icons/fa";
import { APP_ROUTES } from "../../../config/routes";
import { TransactionType } from "../../../types/enums";
import type {
  WalletActivityStatus,
  WalletTab,
} from "../../../types/wallet.types";

export type WalletQuickAction = {
  label: string;
  icon: IconType;
  color: string;
  bg: string;
  path: string;
};

export const WALLET_TABS: readonly WalletTab[] = ["overview", "requests"];

export const WALLET_TYPE_ICON: Partial<Record<TransactionType, string>> = {
  [TransactionType.INCOME]: "💰",
  [TransactionType.EXPENSE]: "🎮",
  [TransactionType.TRANSFER]: "↗️",
  [TransactionType.DEPOSIT]: "💳",
  [TransactionType.WITHDRAWAL]: "💸",
  [TransactionType.GAME_ENTRY]: "🎮",
  [TransactionType.GAME_WIN]: "🏆",
  [TransactionType.AGENT_COMMISSION]: "🤝",
  [TransactionType.REFERRAL_BONUS]: "🎁",
};

export const WALLET_TYPE_COLOR: Partial<Record<TransactionType, string>> = {
  [TransactionType.INCOME]: "text-emerald-400",
  [TransactionType.DEPOSIT]: "text-emerald-400",
  [TransactionType.GAME_WIN]: "text-emerald-400",
  [TransactionType.REFERRAL_BONUS]: "text-emerald-400",
  [TransactionType.AGENT_COMMISSION]: "text-emerald-400",
  [TransactionType.EXPENSE]: "text-rose-400",
  [TransactionType.WITHDRAWAL]: "text-rose-400",
  [TransactionType.GAME_ENTRY]: "text-rose-400",
  [TransactionType.TRANSFER]: "text-orange-400",
};

export const WALLET_INCOME_TYPES = new Set<TransactionType>([
  TransactionType.INCOME,
  TransactionType.DEPOSIT,
  TransactionType.GAME_WIN,
  TransactionType.REFERRAL_BONUS,
  TransactionType.AGENT_COMMISSION,
]);

export const WALLET_STATUS_STYLE: Partial<
  Record<WalletActivityStatus, string>
> = {
  PENDING: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  COMPLETED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  FAILED: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  PROCESSING: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

export const WALLET_QUICK_ACTIONS: WalletQuickAction[] = [
  {
    label: "Deposit",
    icon: FaArrowDown,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    path: APP_ROUTES.depositMoney,
  },
  {
    label: "Withdraw",
    icon: FaArrowUp,
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
    path: APP_ROUTES.getMoney,
  },
  {
    label: "Transfer",
    icon: FaExchangeAlt,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
    path: APP_ROUTES.transfer,
  },
];
