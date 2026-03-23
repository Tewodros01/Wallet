import { TransactionType } from "../../../types/enums";
import type {
  ActivityItem,
  Deposit,
  Transaction,
  WalletActivityStatus,
  Withdrawal,
} from "../../../types/wallet.types";
import {
  WALLET_INCOME_TYPES,
  WALLET_TYPE_COLOR,
  WALLET_TYPE_ICON,
} from "./constants";

const DEFAULT_ACTIVITY_ICON = "💱";
const DEFAULT_ACTIVITY_COLOR = "text-gray-400";
const MAX_ACTIVITY_ITEMS = 20;

export function formatWalletDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getWalletStatusLabel(status: WalletActivityStatus) {
  return status === "PROCESSING"
    ? "Processing"
    : status.charAt(0) + status.slice(1).toLowerCase();
}

export function buildWalletActivity(
  transactions: Transaction[],
  deposits: Deposit[],
  withdrawals: Withdrawal[],
): ActivityItem[] {
  const completedDepositIds = new Set(
    transactions
      .filter((transaction) => transaction.type === TransactionType.DEPOSIT)
      .map((transaction) => transaction.id),
  );

  const completedWithdrawalIds = new Set(
    transactions
      .filter((transaction) => transaction.type === TransactionType.WITHDRAWAL)
      .map((transaction) => transaction.id),
  );

  return [
    ...transactions
      .filter(
        (transaction) =>
          transaction.type !== TransactionType.DEPOSIT &&
          transaction.type !== TransactionType.WITHDRAWAL,
      )
      .map((transaction) => ({
        id: transaction.id,
        kind: "tx" as const,
        title: transaction.title,
        subtitle: formatWalletDate(transaction.date),
        date: transaction.date,
        amount: Number(transaction.amount),
        isIncome: WALLET_INCOME_TYPES.has(transaction.type),
        status: (transaction.status ?? "COMPLETED") as WalletActivityStatus,
        icon: WALLET_TYPE_ICON[transaction.type] ?? DEFAULT_ACTIVITY_ICON,
        color: WALLET_TYPE_COLOR[transaction.type] ?? DEFAULT_ACTIVITY_COLOR,
      })),
    ...deposits.map((deposit) => ({
      id: deposit.id,
      kind: "deposit" as const,
      title: `Deposit via ${deposit.method}`,
      subtitle: formatWalletDate(deposit.createdAt),
      date: deposit.createdAt,
      amount: deposit.amount,
      isIncome: true,
      status: deposit.status as WalletActivityStatus,
      icon: WALLET_TYPE_ICON[TransactionType.DEPOSIT] ?? DEFAULT_ACTIVITY_ICON,
      color:
        WALLET_TYPE_COLOR[TransactionType.DEPOSIT] ?? DEFAULT_ACTIVITY_COLOR,
    })),
    ...withdrawals.map((withdrawal) => ({
      id: withdrawal.id,
      kind: "withdrawal" as const,
      title: `Withdraw via ${withdrawal.method}`,
      subtitle: `${withdrawal.accountNumber} · ${formatWalletDate(withdrawal.createdAt)}`,
      date: withdrawal.createdAt,
      amount: withdrawal.amount,
      isIncome: false,
      status: withdrawal.status as WalletActivityStatus,
      icon:
        WALLET_TYPE_ICON[TransactionType.WITHDRAWAL] ?? DEFAULT_ACTIVITY_ICON,
      color:
        WALLET_TYPE_COLOR[TransactionType.WITHDRAWAL] ?? DEFAULT_ACTIVITY_COLOR,
    })),
  ]
    .filter((item) => {
      if (
        item.kind === "deposit" &&
        item.status === "COMPLETED" &&
        completedDepositIds.has(item.id)
      ) {
        return false;
      }

      if (
        item.kind === "withdrawal" &&
        item.status === "COMPLETED" &&
        completedWithdrawalIds.has(item.id)
      ) {
        return false;
      }

      return true;
    })
    .sort((left, right) => {
      return new Date(right.date).getTime() - new Date(left.date).getTime();
    })
    .slice(0, MAX_ACTIVITY_ITEMS);
}

export function getPendingWalletRequestCount(
  deposits: Deposit[],
  withdrawals: Withdrawal[],
) {
  const pendingDeposits = deposits.filter(
    (deposit) => deposit.status === "PENDING",
  ).length;

  const pendingWithdrawals = withdrawals.filter(
    (withdrawal) =>
      withdrawal.status === "PENDING" || withdrawal.status === "PROCESSING",
  ).length;

  return pendingDeposits + pendingWithdrawals;
}
