import { useState, useEffect } from "react";
import { FiCamera, FiMail, FiPhone, FiSave, FiUser, FiArrowLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { AppBar } from "../components/ui/Layout";
import { useMe, useUpdateMe } from "../hooks/useUser";

export default function EditProfile() {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const { mutate: updateMe, isPending } = useUpdateMe();

  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [username,  setUsername]  = useState("");
  const [phone,     setPhone]     = useState("");
  const [bio,       setBio]       = useState("");
  const [error,     setError]     = useState<string | null>(null);

  // populate form once user data loads
  useEffect(() => {
    if (me) {
      setFirstName(me.firstName ?? "");
      setLastName(me.lastName ?? "");
      setUsername(me.username ?? "");
      setPhone(me.phone ?? "");
      setBio(me.bio ?? "");
    }
  }, [me]);

  const handleSave = () => {
    setError(null);
    updateMe(
      { firstName, lastName, username, phone: phone || undefined, bio: bio || undefined },
      {
        onSuccess: () => navigate("/profile"),
        onError: (err: any) => setError(err?.response?.data?.message ?? "Failed to save"),
      },
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      <AppBar
        left={
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate("/profile")} className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors">
              <FiArrowLeft className="text-white text-sm" />
            </button>
            <span className="text-base font-black">Edit Profile</span>
          </div>
        }
      />

      <div className="flex flex-col gap-6 px-5 py-6">
        {/* Avatar picker */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <img src={me?.avatar ?? "https://i.pravatar.cc/80"} alt="avatar" className="w-24 h-24 rounded-full object-cover ring-4 ring-emerald-500/40" />
            <button type="button" className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-400 transition-colors">
              <FiCamera className="text-white text-sm" />
            </button>
          </div>
          <p className="text-xs text-gray-500">Tap camera to change photo</p>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4">
          <Input
            label="First Name"
            placeholder="First name"
            leftIcon={<FiUser />}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <Input
            label="Last Name"
            placeholder="Last name"
            leftIcon={<FiUser />}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <Input
            label="Username"
            placeholder="@username"
            leftIcon={<span className="text-gray-500 text-sm font-bold">@</span>}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input
            label="Phone"
            type="tel"
            placeholder="+251 91 234 5678"
            leftIcon={<FiPhone />}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Email</label>
            <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.07] rounded-2xl px-4 py-3.5">
              <FiMail className="text-gray-600 shrink-0" />
              <span className="text-sm text-gray-500">{me?.email ?? "—"}</span>
              <span className="ml-auto text-[10px] text-gray-600">Cannot change</span>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Bio</label>
          <textarea
            rows={3}
            placeholder="Tell something about yourself..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full bg-white/[0.06] text-white placeholder-gray-600 border border-white/10 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-emerald-500 focus:bg-white/[0.09] transition-all resize-none"
          />
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-xs text-rose-400 font-semibold text-center">
            {error}
          </div>
        )}

        <Button loading={isPending} icon={<FiSave />} onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
