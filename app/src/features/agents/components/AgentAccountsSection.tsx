import Button from "../../../components/ui/Button";
import EmptyState from "../../../components/ui/EmptyState";
import Input from "../../../components/ui/Input";
import type { FinancialAccountProvider } from "../../../types/enums";
import type { FinancialAccount } from "../../../types/financial-account.types";
import { FiCreditCard, FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import {
  AGENT_ACCOUNT_OPTIONS,
  getAgentProviderMeta,
} from "../constants";

interface AgentAccountsSectionProps {
  financialAccounts: FinancialAccount[];
  editingAccountId: string | null;
  provider: FinancialAccountProvider;
  accountNumber: string;
  accountName: string;
  label: string;
  isDefaultAccount: boolean;
  savingAccount: boolean;
  removingAccountId: string | null;
  accountError: string | null;
  onProviderChange: (provider: FinancialAccountProvider) => void;
  onAccountNumberChange: (value: string) => void;
  onAccountNameChange: (value: string) => void;
  onLabelChange: (value: string) => void;
  onDefaultChange: (value: boolean) => void;
  onSave: () => void;
  onReset: () => void;
  onEdit: (account: FinancialAccount) => void;
  onRemove: (accountId: string) => void;
}

export default function AgentAccountsSection({
  financialAccounts,
  editingAccountId,
  provider,
  accountNumber,
  accountName,
  label,
  isDefaultAccount,
  savingAccount,
  removingAccountId,
  accountError,
  onProviderChange,
  onAccountNumberChange,
  onAccountNameChange,
  onLabelChange,
  onDefaultChange,
  onSave,
  onReset,
  onEdit,
  onRemove,
}: AgentAccountsSectionProps) {
  const defaultAccounts = financialAccounts.filter((account) => account.isDefault);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 py-3 text-center">
          <p className="text-base font-black text-emerald-300">
            {financialAccounts.length}
          </p>
          <p className="text-[9px] uppercase tracking-wide text-gray-500">
            Accounts
          </p>
        </div>
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 py-3 text-center">
          <p className="text-base font-black text-cyan-300">
            {defaultAccounts.length}
          </p>
          <p className="text-[9px] uppercase tracking-wide text-gray-500">
            Default
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 py-3 text-center transition-colors hover:bg-yellow-500/15"
        >
          <p className="flex items-center justify-center gap-1 text-sm font-black text-yellow-300">
            <FiPlus /> New
          </p>
          <p className="text-[9px] uppercase tracking-wide text-gray-500">Add</p>
        </button>
      </div>

      <div className="rounded-2xl border border-white/7 bg-white/4 p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
          {editingAccountId ? "Edit Account" : "Add Financial Account"}
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
              Provider
            </span>
            <select
              value={provider}
              onChange={(event) =>
                onProviderChange(event.target.value as FinancialAccountProvider)
              }
              aria-label="Financial account provider"
              className="h-11 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition-all focus:border-emerald-500 focus:bg-white/9"
            >
              {AGENT_ACCOUNT_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="bg-slate-900"
                >
                  {option.label} · {option.helper}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-gray-500">
              {getAgentProviderMeta(provider)?.helper ?? "Select provider"}
            </span>
          </label>

          <Input
            label="Account Number"
            value={accountNumber}
            onChange={(event) => onAccountNumberChange(event.target.value)}
            placeholder="Enter account number or wallet number"
          />
          <Input
            label="Account Name"
            value={accountName}
            onChange={(event) => onAccountNameChange(event.target.value)}
            placeholder="Optional account holder name"
          />
          <Input
            label="Label"
            value={label}
            onChange={(event) => onLabelChange(event.target.value)}
            placeholder={accountName.trim() || "Defaults to account name"}
          />

          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
            <input
              type="checkbox"
              checked={isDefaultAccount}
              onChange={(event) => onDefaultChange(event.target.checked)}
            />
            <div>
              <p className="text-[13px] font-semibold text-white">
                Make this default
              </p>
              <p className="text-[10px] text-gray-500">
                Show this account first
              </p>
            </div>
          </label>
        </div>

        {accountError && (
          <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {accountError}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Button loading={savingAccount} onClick={onSave} className="flex-1">
            {editingAccountId ? "Update Account" : "Create Account"}
          </Button>
          {editingAccountId && (
            <Button variant="secondary" onClick={onReset} className="w-auto px-4">
              Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {financialAccounts.length === 0 ? (
          <div className="rounded-2xl border border-white/7 bg-white/4">
            <EmptyState
              type="transactions"
              title="No financial accounts yet"
              subtitle="Add Telebirr, M-Pesa, CBE Birr, or bank accounts for user payments."
            />
          </div>
        ) : (
          financialAccounts.map((account) => (
            <div
              key={account.id}
              className="rounded-2xl border border-white/7 bg-white/4 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-black text-white">
                      {getAgentProviderMeta(account.provider)?.label ??
                        account.provider}
                    </p>
                    {account.isDefault && (
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="mt-1 font-mono text-sm text-cyan-300">
                    {account.accountNumber}
                  </p>
                  {(account.accountName || account.label) && (
                    <p className="mt-1 text-xs text-gray-500">
                      {[account.accountName, account.label]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(account)}
                    className="rounded-xl border border-white/10 bg-white/4 p-2 text-gray-300"
                    aria-label={`Edit ${account.provider} account`}
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(account.id)}
                    disabled={removingAccountId === account.id}
                    className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2 text-rose-300 disabled:opacity-60"
                    aria-label={`Remove ${account.provider} account`}
                  >
                    {removingAccountId === account.id ? (
                      <FiCreditCard className="animate-pulse" />
                    ) : (
                      <FiTrash2 />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
