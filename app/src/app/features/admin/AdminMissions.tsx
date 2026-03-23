import { useState } from "react";
import {
  FiArrowLeft,
  FiPlus,
  FiToggleLeft,
  FiToggleRight,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import {
  useCreateMission,
  useDeleteMission,
  useMissions,
  useSeedMissions,
  useUpdateMission,
} from "./hooks";
import { MissionCategory, MissionType } from "../../../types/enums";
import type { MissionListItem } from "../../../types/mission.types";
import { AppBar } from "../../components/ui/Layout";

type MissionForm = {
  title: string;
  desc: string;
  reward: string;
  total: string;
  type: MissionType;
  category: MissionCategory;
  icon: string;
};

type MissionFormKey = keyof MissionForm;

const CATEGORIES: MissionCategory[] = [
  MissionCategory.PLAY_GAMES,
  MissionCategory.WIN_GAMES,
  MissionCategory.DEPOSIT,
  MissionCategory.INVITE,
  MissionCategory.TOURNAMENT,
  MissionCategory.KENO,
];
const TYPES: MissionType[] = [MissionType.DAILY, MissionType.WEEKLY];

function CreateModal({ onClose }: { onClose: () => void }) {
  const { mutate: create, isPending } = useCreateMission();
  const [form, setForm] = useState<MissionForm>({
    title: "",
    desc: "",
    reward: "",
    total: "1",
    type: MissionType.DAILY,
    category: MissionCategory.PLAY_GAMES,
    icon: "🎯",
  });
  const set = (k: MissionFormKey, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-end justify-center">
      <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-t-3xl p-5 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-center">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white">Create Mission</h2>
          <button
            type="button"
            aria-label="Close modal"
            title="Close modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
          >
            <FiX className="text-gray-400 text-sm" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {[
            {
              key: "title",
              label: "Title *",
              placeholder: "e.g. Play 3 Games",
              type: "text",
            },
            {
              key: "desc",
              label: "Description *",
              placeholder: "e.g. Complete 3 bingo games today",
              type: "text",
            },
            {
              key: "reward",
              label: "Reward (coins) *",
              placeholder: "100",
              type: "number",
            },
            {
              key: "total",
              label: "Target Count",
              placeholder: "1",
              type: "number",
            },
            {
              key: "icon",
              label: "Icon (emoji)",
              placeholder: "🎯",
              type: "text",
            },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mb-1">
                {label}
              </p>
              <input
                type={type}
                aria-label={label}
                placeholder={placeholder}
                value={form[key as MissionFormKey]}
                onChange={(e) => set(key as MissionFormKey, e.target.value)}
                className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-emerald-500/50"
              />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mb-1">
                Type
              </p>
              <select
                aria-label="Mission type"
                value={form.type}
                onChange={(e) => set("type", e.target.value as MissionType)}
                className="w-full bg-white/6 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mb-1">
                Category
              </p>
              <select
                aria-label="Mission category"
                value={form.category}
                onChange={(e) =>
                  set("category", e.target.value as MissionCategory)
                }
                className="w-full bg-white/6 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-white/6 border border-white/10 text-gray-400 text-sm font-bold"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isPending || !form.title || !form.desc || !form.reward}
            onClick={() =>
              create(
                {
                  title: form.title,
                  desc: form.desc,
                  reward: parseInt(form.reward),
                  total: parseInt(form.total) || 1,
                  type: form.type,
                  category: form.category,
                  icon: form.icon || "🎯",
                },
                { onSuccess: onClose },
              )
            }
            className="flex-1 py-3 rounded-2xl bg-emerald-500 text-white text-sm font-black flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.97] transition-all"
          >
            {isPending ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <FiPlus /> Create
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminMissions() {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "DAILY" | "WEEKLY">("ALL");

  const { data: missions = [], isLoading } = useMissions();
  const { mutate: update } = useUpdateMission();
  const { mutate: remove, isPending: deleting } = useDeleteMission();
  const { mutate: seed, isPending: seeding } = useSeedMissions();

  const filtered =
    filter === "ALL"
      ? missions
      : missions.filter((m: MissionListItem) => m.type === filter);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      <AppBar
        left={
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Go back"
              title="Go back"
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
            >
              <FiArrowLeft className="text-white text-sm" />
            </button>
            <div>
              <p className="text-base font-black text-white leading-tight">
                Missions
              </p>
              <p className="text-[10px] text-gray-500">
                {missions.length} total
              </p>
            </div>
          </div>
        }
        right={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => seed()}
              disabled={seeding}
              className="text-[10px] font-bold px-3 py-1.5 rounded-xl bg-violet-500/15 border border-violet-500/25 text-violet-400 hover:bg-violet-500/25 transition-colors disabled:opacity-40"
            >
              {seeding ? "…" : "Seed"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/25 rounded-xl px-3 py-1.5 text-emerald-400 text-xs font-bold hover:bg-emerald-500/25 transition-colors"
            >
              <FiPlus /> New
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto px-5 py-4 pb-12 flex flex-col gap-4">
        {/* Filter tabs */}
        <div className="flex gap-1.5 bg-white/4 border border-white/7 rounded-2xl p-1">
          {(["ALL", "DAILY", "WEEKLY"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold transition-all ${filter === f ? "bg-emerald-500 text-white" : "text-gray-500"}`}
            >
              {f}
            </button>
          ))}
        </div>

        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-white/4 rounded-2xl animate-pulse"
            />
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-gray-600">
            <p className="text-3xl">🎯</p>
            <p className="text-sm font-semibold">No missions yet</p>
            <button
              type="button"
              onClick={() => seed()}
              className="px-5 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-bold"
            >
              Seed Default Missions
            </button>
          </div>
        ) : (
          filtered.map((m: MissionListItem) => (
            <div
              key={m.id}
              className={`bg-white/4 border rounded-2xl p-4 flex items-center gap-3 transition-all ${m.isActive !== false ? "border-white/7" : "border-white/3 opacity-50"}`}
            >
              <span className="text-2xl shrink-0">{m.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white truncate">
                  {m.title}
                </p>
                <p className="text-[11px] text-gray-500 truncate">{m.desc}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                    +{m.reward} coins
                  </span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25">
                    {m.type}
                  </span>
                  <span className="text-[9px] text-gray-600">×{m.total}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  aria-label={
                    m.isActive !== false
                      ? `Disable mission ${m.title}`
                      : `Enable mission ${m.title}`
                  }
                  title={
                    m.isActive !== false ? "Disable mission" : "Enable mission"
                  }
                  onClick={() =>
                    update({
                      id: m.id,
                      dto: { isActive: !(m.isActive !== false) },
                    })
                  }
                  className="text-lg text-gray-400 hover:text-emerald-400 transition-colors"
                >
                  {m.isActive !== false ? (
                    <FiToggleRight className="text-emerald-400 text-xl" />
                  ) : (
                    <FiToggleLeft className="text-xl" />
                  )}
                </button>
                <button
                  type="button"
                  aria-label={`Delete mission ${m.title}`}
                  title="Delete mission"
                  disabled={deleting}
                  onClick={() => remove(m.id)}
                  className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 hover:bg-rose-500/20 transition-colors disabled:opacity-40"
                >
                  <FiTrash2 className="text-xs" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
