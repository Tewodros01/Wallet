import type { IconType } from "react-icons";
import { FaCoins } from "react-icons/fa";
import { FiCreditCard, FiTrendingUp, FiUsers } from "react-icons/fi";
import { MdOutlineAccountBalanceWallet } from "react-icons/md";
import { FinancialAccountProvider } from "../../../types/enums";

export type AgentTab =
  | "deposits"
  | "withdrawals"
  | "users"
  | "accounts"
  | "earnings";

export type AgentTabConfig = {
  id: AgentTab;
  label: string;
  icon: IconType;
};

export const AGENT_TABS: AgentTabConfig[] = [
  {
    id: "deposits",
    label: "Deposits",
    icon: MdOutlineAccountBalanceWallet,
  },
  { id: "withdrawals", label: "Withdrawals", icon: FiTrendingUp },
  { id: "users", label: "My Users", icon: FiUsers },
  { id: "accounts", label: "Accounts", icon: FiCreditCard },
  { id: "earnings", label: "Earnings", icon: FaCoins },
];

export type AgentAccountOption = {
  value: FinancialAccountProvider;
  label: string;
  helper: string;
};

export const AGENT_ACCOUNT_OPTIONS: AgentAccountOption[] = [
  {
    value: FinancialAccountProvider.TELEBIRR,
    label: "Telebirr",
    helper: "Mobile wallet",
  },
  {
    value: FinancialAccountProvider.MPESA,
    label: "M-Pesa",
    helper: "Mobile wallet",
  },
  {
    value: FinancialAccountProvider.CBE_BIRR,
    label: "CBE Birr",
    helper: "Mobile wallet",
  },
  {
    value: FinancialAccountProvider.BOA,
    label: "BOA",
    helper: "Bank account",
  },
  {
    value: FinancialAccountProvider.OTHER_BANK,
    label: "Other Bank",
    helper: "Bank account",
  },
  {
    value: FinancialAccountProvider.OTHER_WALLET,
    label: "Other Wallet",
    helper: "Mobile wallet",
  },
];

export const getAgentProviderMeta = (provider: FinancialAccountProvider) =>
  AGENT_ACCOUNT_OPTIONS.find((option) => option.value === provider);
