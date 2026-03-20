import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useRef, useState } from "react";
import {
  FiArrowLeft,
  FiCamera,
  FiMail,
  FiPhone,
  FiSave,
  FiUser,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { usersApi } from "../api/users.api";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { AppBar } from "../components/ui/Layout";
import { userKeys, useMe, useUpdateMe } from "../hooks/useUser";
import { getErrorMessage } from "../lib/errors";
import { useAuthStore } from "../store/auth.store";

export default function EditProfile() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: me } = useMe();
  const { mutate: updateMe, isPending } = useUpdateMe();
  const setUser = useAuthStore((s) => s.setUser);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bioId = useId();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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
      {
        firstName,
        lastName,
        username,
        phone: phone || undefined,
        bio: bio || undefined,
      },
      {
        onSuccess: () => navigate("/profile"),
        onError: (err: unknown) =>
          setError(getErrorMessage(err, "Failed to save")),
      },
    );
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setError(null);
    setUploading(true);
    try {
      const { user } = await usersApi.uploadAvatar(file);
      setUser(user);
      qc.setQueryData(userKeys.me, user);
      setAvatarPreview(user.avatar);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to upload avatar"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      <AppBar
        left={
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Go back"
              title="Go back"
              onClick={() => navigate("/profile")}
              className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
            >
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
            <img
              src={avatarPreview ?? me?.avatar ?? "https://i.pravatar.cc/80"}
              alt="avatar"
              className="w-24 h-24 rounded-full object-cover ring-4 ring-emerald-500/40"
            />
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
            <button
              type="button"
              aria-label="Change profile photo"
              title="Change profile photo"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-400 transition-colors"
            >
              <FiCamera className="text-white text-sm" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              aria-label="Upload profile photo"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <p className="text-xs text-gray-500">
            Tap camera to change photo (max 2MB)
          </p>
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
            leftIcon={
              <span className="text-gray-500 text-sm font-bold">@</span>
            }
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
            <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
              Email
            </label>
            <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.07] rounded-2xl px-4 py-3.5">
              <FiMail className="text-gray-600 shrink-0" />
              <span className="text-sm text-gray-500">{me?.email ?? "—"}</span>
              <span className="ml-auto text-[10px] text-gray-600">
                Cannot change
              </span>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={bioId}
            className="text-[11px] font-bold uppercase tracking-widest text-gray-500"
          >
            Bio
          </label>
          <textarea
            id={bioId}
            aria-label="Bio"
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
