/**
 * プロフィールページコンポーネント
 * ユーザーのプロフィール情報を表示・編集
 * アバター画像と自己紹介文の変更が可能
 */

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { getAuth } from '../../lib/auth';
import { setStoredProfile, useProfile } from '../../lib/profile';
import { getMyProfile, updateProfile } from '../../api';
import { DEFAULT_AVATAR } from '../../constants';
import MainHeader from '../../components/MainHeader';

/**
 * ProfilePageコンポーネント
 * マウント時にAPIからプロフィール情報を取得
 * アバター画像と自己紹介文の編集・保存機能を提供
 */
const ProfilePage = () => {
  const profile = useProfile();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(profile.imageUrl || DEFAULT_AVATAR);
  const [bio, setBio] = useState(
    profile.bio || "Language Master. Passionate about world scripts and phonetics."
  );
  const [displayName, setDisplayName] = useState("Alex G.");

  useEffect(() => {
    const auth = getAuth();
    if (auth?.username) {
      setDisplayName(auth.username);
    }
  }, []);

  useEffect(() => {
    const auth = getAuth();
    if (!auth?.token) return;

    // 新しいAPI層を使用
    getMyProfile()
      .then((data) => {
        setStoredProfile({
          imageUrl: data.imageUrl,
          bio: data.bio,
          username: data.username,
          rating: data.rating,
        });
      })
      .catch((error) => {
        console.error("Failed to load profile:", error);
      });
  }, []);

  useEffect(() => {
    if (profile.imageUrl) {
      setAvatarUrl(profile.imageUrl);
    }
    if (profile.bio !== undefined) {
      setBio(profile.bio || "");
    }
    if (profile.username) {
      setDisplayName(profile.username);
    }
  }, [profile.bio, profile.imageUrl, profile.username]);

  const handlePickAvatar = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl) return;
      setAvatarUrl(dataUrl);
      setStoredProfile({ imageUrl: dataUrl });

      const auth = getAuth();
      if (!auth?.token) return;

      // 新しいAPI層を使用
      try {
        await updateProfile({ imageUrl: dataUrl });
      } catch (error) {
        console.error("Failed to update avatar:", error);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const auth = getAuth();
    if (!auth?.token) return;

    // 新しいAPI層を使用
    try {
      await updateProfile({ bio });
      setStoredProfile({ bio });
    } catch (error) {
      console.error("Failed to save bio:", error);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background-dark text-slate-100">
      <MainHeader avatarUrl={avatarUrl} />

      <main className="flex flex-1 flex-col items-center overflow-y-auto px-6 py-10 lg:px-16">
        <div className="w-full max-w-4xl">
          <div className="mb-8">
            <h1 className="pb-2 text-[28px] font-bold leading-tight tracking-tight text-slate-50">
              User Profile
            </h1>
            <p className="text-sm font-normal text-slate-400">
              Manage your account information and preferences.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-800 p-7 shadow-sm md:p-10">
            <div className="mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-xl text-primary">
                edit_square
              </span>
              <h2 className="text-xl font-bold">Edit Profile</h2>
            </div>

            <div className="flex flex-col items-center gap-10 md:flex-row md:items-start">
              <div className="group relative">
                <div className="size-32 overflow-hidden rounded-full border-4 border-slate-100 bg-slate-200 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                  <img
                    alt="Profile Avatar"
                    className="h-full w-full object-cover"
                    src={avatarUrl}
                  />
                </div>
                <button
                  type="button"
                  onClick={handlePickAvatar}
                  className="absolute bottom-2 right-2 flex items-center justify-center rounded-full bg-primary p-2.5 text-white shadow-lg transition-transform hover:scale-110"
                >
                  <span className="material-symbols-outlined text-base">
                    photo_camera
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>

              <div className="w-full flex-1 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Display Name
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-base text-slate-100 transition-all outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
                    type="text"
                    value={displayName}
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Bio
                  </label>
                  <textarea
                    className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 transition-all outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
                    style={{ fontFamily: 'inherit' }}
                    rows={3}
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                  />
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    className="w-full rounded-full bg-primary px-10 py-3 text-base font-bold text-white shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] md:w-auto"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
