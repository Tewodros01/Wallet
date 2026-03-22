import { FiExternalLink, FiImage } from "react-icons/fi";
import { MdPictureAsPdf } from "react-icons/md";
import BottomSheet from "../ui/BottomSheet";

interface ProofViewerSheetProps {
  url: string | null;
  open: boolean;
  onClose: () => void;
}

function getProofKind(url: string) {
  if (url.startsWith("data:image") || /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(url)) {
    return "image";
  }
  if (url.startsWith("data:application/pdf") || /\.pdf(\?.*)?$/i.test(url)) {
    return "pdf";
  }
  return "file";
}

export default function ProofViewerSheet({
  url,
  open,
  onClose,
}: ProofViewerSheetProps) {
  if (!open || !url) return null;

  const kind = getProofKind(url);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Payment Proof"
      subtitle="Review before approving the deposit"
      footer={
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300"
        >
          <FiExternalLink />
          Open in browser
        </a>
      }
    >
      <div className="rounded-2xl border border-white/10 bg-white/4 p-3">
        {kind === "image" ? (
          <img
            src={url}
            alt="Payment proof"
            className="max-h-[55vh] w-full rounded-2xl object-contain"
          />
        ) : kind === "pdf" ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <MdPictureAsPdf className="text-5xl text-rose-400" />
            <p className="text-sm font-bold text-white">PDF proof attached</p>
            <p className="text-xs text-gray-500 break-all">{url}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <FiImage className="text-4xl text-gray-500" />
            <p className="text-xs text-gray-400 break-all">{url}</p>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
