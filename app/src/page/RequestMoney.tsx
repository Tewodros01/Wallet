import { useEffect, useMemo, useState } from "react";
import { FaCoins, FaMoneyCheckAlt, FaStore } from "react-icons/fa";
import { FiArrowLeft, FiCheckCircle, FiClock, FiSend } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import { AppBar, BottomNav } from "../components/ui/Layout";
import { APP_ROUTES } from "../config/routes";
import {
  useCancelPaymentRequest,
  useCreatePaymentRequest,
  useMyPaymentRequests,
  usePayPaymentRequest,
  usePayablePaymentRequests,
} from "../hooks/usePayments";
import { useMe } from "../hooks/useUser";
import { getErrorMessage } from "../lib/errors";
import { useWalletStore } from "../store/wallet.store";
import { PaymentRequestStatus } from "../types/enums";
import type { PaymentRequest } from "../types/payment.types";

type Tab = "collect" | "mine" | "pay";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  PAID: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  CANCELLED: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  EXPIRED: "bg-gray-500/15 text-gray-300 border-gray-500/30",
};

function formatDate(value: string | null) {
  if (!value) return "No expiry";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status: PaymentRequestStatus) {
  switch (status) {
    case PaymentRequestStatus.PAID:
      return "Paid";
    case PaymentRequestStatus.CANCELLED:
      return "Cancelled";
    case PaymentRequestStatus.EXPIRED:
      return "Expired";
    default:
      return "Pending";
  }
}

function RequestCard({
  request,
  onPay,
  onCancel,
  canPay,
  busy,
}: {
  request: PaymentRequest;
  onPay?: () => void;
  onCancel?: () => void;
  canPay?: boolean;
  busy?: boolean;
}) {
  const title =
    request.merchantLabel ||
    `${request.creator.firstName} ${request.creator.lastName}`.trim() ||
    `@${request.creator.username}`;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-white">{title}</p>
          <p className="mt-1 text-xs text-gray-500">Ref {request.reference}</p>
        </div>
        <span
          className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wide ${STATUS_STYLES[request.status] ?? STATUS_STYLES.PENDING}`}
        >
          {statusLabel(request.status)}
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Amount
          </p>
          <div className="mt-1 flex items-center gap-2">
            <FaCoins className="text-yellow-400" />
            <span className="text-2xl font-black text-yellow-300">
              {request.amount.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="text-right text-xs text-gray-500">
          <p>Created {formatDate(request.createdAt)}</p>
          <p>Expires {formatDate(request.expiresAt)}</p>
        </div>
      </div>

      {request.note && (
        <div className="mt-4 rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-xs text-gray-300">
          {request.note}
        </div>
      )}

      {request.payer && (
        <p className="mt-4 text-xs text-emerald-300">
          Paid by {request.payer.firstName} {request.payer.lastName}
        </p>
      )}

      {(canPay || onCancel) && (
        <div className="mt-4 flex gap-2">
          {canPay && onPay && (
            <Button
              onClick={onPay}
              loading={busy}
              icon={<FiSend />}
              className="flex-1"
            >
              Pay Now
            </Button>
          )}
          {onCancel && (
            <Button
              onClick={onCancel}
              loading={busy}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default function RequestMoney() {
  const navigate = useNavigate();
  const { balance, syncFromUser, setBalance } = useWalletStore();
  const { data: me } = useMe();
  const { data: myRequests = [] } = useMyPaymentRequests();
  const { data: payableRequests = [] } = usePayablePaymentRequests();
  const createRequest = useCreatePaymentRequest();
  const payRequest = usePayPaymentRequest();
  const cancelRequest = useCancelPaymentRequest();

  const [tab, setTab] = useState<Tab>("collect");
  const [amount, setAmount] = useState("");
  const [merchantLabel, setMerchantLabel] = useState("");
  const [note, setNote] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (me?.coinsBalance !== undefined) {
      syncFromUser(me.coinsBalance);
    }
  }, [me?.coinsBalance, syncFromUser]);

  const stats = useMemo(
    () => ({
      pending: myRequests.filter((request) => request.status === PaymentRequestStatus.PENDING).length,
      collectible: payableRequests.reduce((sum, request) => sum + request.amount, 0),
    }),
    [myRequests, payableRequests],
  );

  const handleCreate = () => {
    setError(null);
    setSuccess(null);
    const numAmount = Number(amount);
    if (!numAmount) {
      setError("Enter a valid amount.");
      return;
    }

    createRequest.mutate(
      {
        amount: numAmount,
        merchantLabel: merchantLabel.trim() || undefined,
        note: note.trim() || undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      },
      {
        onSuccess: (request) => {
          setAmount("");
          setMerchantLabel("");
          setNote("");
          setExpiresAt("");
          setTab("mine");
          setSuccess(`Request ${request.reference} is ready to collect.`);
        },
        onError: (err: Error) =>
          setError(getErrorMessage(err, "Could not create payment request")),
      },
    );
  };

  const handlePay = (request: PaymentRequest) => {
    setError(null);
    setSuccess(null);
    payRequest.mutate(request.id, {
      onSuccess: () => {
        setBalance(Math.max(0, balance - request.amount));
        setSuccess(`You paid ${request.reference} successfully.`);
      },
      onError: (err: Error) =>
        setError(getErrorMessage(err, "Could not pay payment request")),
    });
  };

  const handleCancel = (requestId: string) => {
    setError(null);
    setSuccess(null);
    cancelRequest.mutate(requestId, {
      onSuccess: () => setSuccess("Payment request cancelled."),
      onError: (err: Error) =>
        setError(getErrorMessage(err, "Could not cancel payment request")),
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <AppBar
        left={
          <button
            type="button"
            onClick={() => navigate(APP_ROUTES.wallet)}
            aria-label="Go back"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]"
          >
            <FiArrowLeft className="text-sm text-white" />
          </button>
        }
        center={<span className="text-base font-black">Request Money</span>}
      />

      <div className="px-5 py-5 pb-28">
        <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-cyan-500/5 p-5">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-emerald-300">
            <FaStore />
            Merchant Collection
          </div>
          <h1 className="mt-3 text-2xl font-black leading-tight text-white">
            Collect wallet payments from customers and friends.
          </h1>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">
                Balance
              </p>
              <p className="mt-2 text-lg font-black text-yellow-300">
                {balance.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">
                Pending
              </p>
              <p className="mt-2 text-lg font-black text-orange-300">
                {stats.pending}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">
                To Pay
              </p>
              <p className="mt-2 text-lg font-black text-cyan-300">
                {stats.collectible.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-1.5">
          {[
            { id: "collect", label: "Collect" },
            { id: "mine", label: "My Requests" },
            { id: "pay", label: "Pay" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id as Tab)}
              className={`rounded-xl px-3 py-2 text-xs font-black transition-colors ${tab === item.id ? "bg-emerald-500 text-white" : "text-gray-400"}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {success}
          </div>
        )}

        {tab === "collect" && (
          <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 text-sm font-black text-white">
              <FaMoneyCheckAlt className="text-emerald-400" />
              Create a collection request
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-gray-500">
                  Amount
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="10"
                  placeholder="250"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/40"
                />
              </div>
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-gray-500">
                  Merchant Name
                </label>
                <input
                  type="text"
                  placeholder={me ? `${me.firstName} ${me.lastName}` : "Shop name"}
                  value={merchantLabel}
                  onChange={(event) => setMerchantLabel(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/40"
                />
              </div>
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-gray-500">
                  Note
                </label>
                <textarea
                  rows={3}
                  placeholder="School fees, grocery order, delivery payment..."
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/40"
                />
              </div>
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-gray-500">
                  Expires At
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(event) => setExpiresAt(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/40"
                />
              </div>
              <Button
                onClick={handleCreate}
                loading={createRequest.isPending}
                icon={<FiSend />}
              >
                Create Payment Request
              </Button>
            </div>
          </div>
        )}

        {tab === "mine" && (
          <div className="mt-5 space-y-3">
            {myRequests.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-8 text-center">
                <FiClock className="mx-auto text-3xl text-gray-500" />
                <p className="mt-3 text-sm font-bold text-white">No requests yet</p>
                <p className="mt-1 text-sm text-gray-500">
                  Start with rent, groceries, school fees, or deliveries.
                </p>
              </div>
            ) : (
              myRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onCancel={
                    request.status === PaymentRequestStatus.PENDING
                      ? () => handleCancel(request.id)
                      : undefined
                  }
                  busy={cancelRequest.isPending}
                />
              ))
            )}
          </div>
        )}

        {tab === "pay" && (
          <div className="mt-5 space-y-3">
            {payableRequests.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-8 text-center">
                <FiCheckCircle className="mx-auto text-3xl text-emerald-400" />
                <p className="mt-3 text-sm font-bold text-white">Nothing pending</p>
                <p className="mt-1 text-sm text-gray-500">
                  New payment requests from sellers or friends will show here.
                </p>
              </div>
            ) : (
              payableRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  canPay={balance >= request.amount}
                  onPay={() => handlePay(request)}
                  busy={payRequest.isPending}
                />
              ))
            )}
            {payableRequests.some((request) => balance < request.amount) && (
              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
                Some requests are above your current balance, so they stay visible until you top up.
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
