export function SkeletonLine({
  w = "w-full",
  h = "h-3",
}: {
  w?: string;
  h?: string;
}) {
  return (
    <div className={`${w} ${h} bg-white/7 rounded-full animate-pulse`} />
  );
}

export function SkeletonAvatar({ size = "w-10 h-10" }: { size?: string }) {
  return (
    <div
      className={`${size} rounded-full bg-white/7 animate-pulse shrink-0`}
    />
  );
}

export function SkeletonRoomCard() {
  return (
    <div className="bg-white/4 border border-white/7 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <SkeletonAvatar size="w-11 h-11" />
        <div className="flex-1 flex flex-col gap-2">
          <SkeletonLine w="w-2/3" h="h-3.5" />
          <SkeletonLine w="w-1/3" h="h-2.5" />
        </div>
        <SkeletonLine w="w-14" h="h-5" />
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-14 bg-white/4 rounded-xl animate-pulse"
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <SkeletonLine w="w-24" h="h-4" />
        <SkeletonLine w="w-20" h="h-9" />
      </div>
    </div>
  );
}

export function SkeletonTxRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="w-9 h-9 rounded-xl bg-white/6 animate-pulse shrink-0" />
      <div className="flex-1 flex flex-col gap-1.5">
        <SkeletonLine w="w-1/2" h="h-3" />
        <SkeletonLine w="w-1/4" h="h-2.5" />
      </div>
      <SkeletonLine w="w-12" h="h-3" />
    </div>
  );
}

export function SkeletonMissionCard() {
  return (
    <div className="bg-white/4 border border-white/7 rounded-2xl p-4 flex items-center gap-3">
      <div className="w-11 h-11 rounded-2xl bg-white/6 animate-pulse shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <SkeletonLine w="w-2/3" h="h-3.5" />
        <SkeletonLine w="w-full" h="h-2" />
        <SkeletonLine w="w-full" h="h-1.5" />
      </div>
      <div className="flex flex-col items-end gap-2">
        <SkeletonLine w="w-10" h="h-3" />
        <SkeletonLine w="w-14" h="h-7" />
      </div>
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="bg-white/4 border border-white/7 rounded-2xl p-3 flex flex-col gap-1.5">
      <div className="w-5 h-5 rounded-full bg-white/7 animate-pulse" />
      <SkeletonLine w="w-12" h="h-5" />
      <SkeletonLine w="w-16" h="h-2.5" />
    </div>
  );
}

export function SkeletonLeaderRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-7 h-7 rounded-xl bg-white/6 animate-pulse shrink-0" />
      <SkeletonAvatar size="w-8 h-8" />
      <SkeletonLine w="w-1/3" h="h-3" />
      <div className="ml-auto">
        <SkeletonLine w="w-14" h="h-3" />
      </div>
    </div>
  );
}
