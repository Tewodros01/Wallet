import { useState } from "react";
import { FaCoins } from "react-icons/fa";
import { FiArrowLeft, FiCheck, FiCopy } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { useTransaction } from "./hooks";
import { AppBar } from "../../components/ui/Layout";

const TransactionReceipt = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: transaction, isLoading } = useTransaction(id!);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col text-white">
        <AppBar
          left={
            <div className="flex items-center gap-3">
              <button
                aria-label="Go back"
                title="Go back"
                onClick={() => navigate(-1)}
                className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center"
              >
                <FiArrowLeft className="text-white text-sm" />
              </button>
              <span className="text-base font-black">Transaction Receipt</span>
            </div>
          }
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col text-white">
        <AppBar
          left={
            <div className="flex items-center gap-3">
              <button
                aria-label="Go back"
                title="Go back"
                onClick={() => navigate(-1)}
                className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center"
              >
                <FiArrowLeft className="text-white text-sm" />
              </button>
              <span className="text-base font-black">Transaction Receipt</span>
            </div>
          }
        />
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-600">
          <FaCoins className="text-3xl" />
          <p className="text-sm font-semibold">Transaction not found</p>
        </div>
      </div>
    );
  }

  const isIncome = [
    "DEPOSIT",
    "GAME_WIN",
    "REFERRAL_BONUS",
    "AGENT_COMMISSION",
  ].includes(transaction.type);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      <AppBar
        left={
          <div className="flex items-center gap-3">
            <button
              aria-label="Go back"
              title="Go back"
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
            >
              <FiArrowLeft className="text-white text-sm" />
            </button>
            <span className="text-base font-black">Transaction Receipt</span>
          </div>
        }
      />

      <div className="flex flex-col gap-6 px-5 py-6 pb-10">
        {/* Amount Card */}
        <div
          className={`${isIncome ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20"} border rounded-2xl p-6 text-center`}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <FaCoins className="text-yellow-400 text-xl" />
            <span
              className={`text-3xl font-black ${isIncome ? "text-emerald-400" : "text-rose-400"}`}
            >
              {isIncome ? "+" : "-"}
              {Number(transaction.amount).toLocaleString()}
            </span>
          </div>
          <p className="text-lg font-bold text-white">{transaction.title}</p>
          <span
            className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${
              transaction.status === "COMPLETED"
                ? "bg-emerald-500/20 text-emerald-400"
                : transaction.status === "PENDING"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-rose-500/20 text-rose-400"
            }`}
          >
            {transaction.status}
          </span>
        </div>

        {/* Details */}
        <div className="bg-white/4 border border-white/7 rounded-2xl p-5">
          <h3 className="text-lg font-bold text-white mb-4">
            Transaction Details
          </h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Transaction ID</span>
              <div className="flex items-center gap-2">
                <span className="text-white font-mono text-sm">
                  {transaction.id.slice(0, 8)}...
                </span>
                <button
                  aria-label={
                    copied ? "Copied transaction ID" : "Copy transaction ID"
                  }
                  title={copied ? "Copied" : "Copy transaction ID"}
                  onClick={() => copyToClipboard(transaction.id)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  {copied ? (
                    <FiCheck className="text-emerald-400 text-sm" />
                  ) : (
                    <FiCopy className="text-gray-400 text-sm" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">Type</span>
              <span className="text-white font-semibold">
                {transaction.type.replace("_", " ")}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">Date</span>
              <span className="text-white">
                {new Date(transaction.createdAt).toLocaleString()}
              </span>
            </div>

            {transaction.note && (
              <div className="flex justify-between items-start">
                <span className="text-gray-400">Note</span>
                <span className="text-white text-right max-w-[200px]">
                  {transaction.note}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Share Button */}
        <button
          onClick={() => {
            const text = `Transaction Receipt\n${transaction.title}\nAmount: ${isIncome ? "+" : "-"}${Number(transaction.amount).toLocaleString()} coins\nDate: ${new Date(transaction.createdAt).toLocaleString()}\nID: ${transaction.id}`;
            if (navigator.share) {
              navigator.share({ text });
            } else {
              copyToClipboard(text);
            }
          }}
          className="w-full py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors"
        >
          Share Receipt
        </button>
      </div>
    </div>
  );
};

export default TransactionReceipt;
