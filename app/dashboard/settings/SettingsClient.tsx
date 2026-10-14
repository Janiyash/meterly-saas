"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

const PROVIDER_LABEL: Record<string, string> = {
  google: "Google",
  github: "GitHub",
};

export default function SettingsClient({
  initialName,
  email,
  initialImage,
  connectedSince,
  providers,
}: {
  initialName: string;
  email: string;
  initialImage: string | null;
  connectedSince: string | null;
  providers: string[];
}) {
  const [name, setName] = useState(initialName);
  const [image, setImage] = useState(initialImage ?? "");
  const [editingImage, setEditingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const initial = (name || email || "?").trim()[0]?.toUpperCase() ?? "?";

  async function saveProfile() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, image: image.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setSaved(true);
      setEditingImage(false);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete account");
      await signOut({ callbackUrl: "/" });
    } catch {
      setDeleting(false);
      setError("Failed to delete account — please try again.");
    }
  }

  return (
    <div className="st">
      <style>{`
        .st-block { border-top: 1px solid var(--line-strong); padding: 26px 0; }
        .st-label { font-size: 11px; font-weight: 700; color: var(--ink-faint); margin-bottom: 14px; }
        .st-field { margin-bottom: 16px; max-width: 380px; }
        .st-field label { display: block; font-size: 12px; color: var(--ink-soft); margin-bottom: 6px; }
        .st-input {
          width: 100%; background: var(--surface); border: 1px solid var(--line);
          color: var(--ink); font-size: 14px; padding: 10px 12px; outline: none;
        }
        .st-input:focus { border-color: var(--line-strong); }
        .st-input:disabled { color: var(--ink-faint); }
        .st-hint { font-size: 11px; color: var(--ink-faint); margin-top: 6px; }
        .st-row { display: flex; align-items: center; gap: 12px; }
        .st-saved { font-size: 12px; color: var(--brass); }
        .st-error { font-size: 12px; color: var(--bad); margin-top: 8px; }

        /* Profile picture */
        .st-avatar-row { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
        .st-avatar {
          width: 56px; height: 56px; border-radius: 50%; object-fit: cover;
          border: 1px solid var(--line-strong); flex-shrink: 0;
        }
        .st-avatar-fallback {
          width: 56px; height: 56px; border-radius: 50%; flex-shrink: 0;
          background: var(--brass-tint); border: 1px solid var(--brass);
          color: var(--brass-deep); display: flex; align-items: center; justify-content: center;
          font-size: 20px; font-weight: 700;
        }
        .st-avatar-actions { display: flex; flex-direction: column; gap: 6px; }
        .st-avatar-btn {
          background: none; border: 1px solid var(--line-strong); color: var(--ink-soft);
          font-size: 12.5px; font-weight: 600; padding: 6px 12px; border-radius: var(--radius-pill);
          cursor: pointer; width: fit-content; transition: border-color 0.15s, color 0.15s;
        }
        .st-avatar-btn:hover { border-color: var(--brass); color: var(--brass-deep); }
        .st-avatar-note { font-size: 11px; color: var(--ink-faint); }

        .st-image-edit { display: flex; flex-direction: column; gap: 8px; max-width: 380px; margin-top: 10px; }
        .st-image-edit-row { display: flex; gap: 8px; }
        .st-image-edit-row .st-input { flex: 1; }

        /* Connected accounts */
        .st-conn-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; padding: 12px 14px; border: 1px solid var(--line);
          background: var(--surface); max-width: 420px; margin-bottom: 8px;
        }
        .st-conn-left { display: flex; align-items: center; gap: 10px; }
        .st-conn-icon {
          width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
          background: var(--surface-dim); border: 1px solid var(--line-strong);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: var(--ink-soft);
        }
        .st-conn-name { font-size: 13px; font-weight: 600; color: var(--ink); }
        .st-conn-since { font-size: 11px; color: var(--ink-faint); }
        .st-conn-badge {
          font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--brass-deep); background: var(--brass-tint);
          padding: 2px 8px; border-radius: var(--radius-pill);
          display: inline-flex; align-items: center; gap: 5px;
        }
        .st-conn-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--brass); }
        .st-conn-empty { font-size: 12.5px; color: var(--ink-faint); }

        .st-danger-title { font-size: 13px; font-weight: 700; color: var(--bad); margin-bottom: 8px; }
        .st-danger-copy { font-size: 13px; color: var(--ink-soft); line-height: 1.6; max-width: 48ch; margin-bottom: 18px; }

        .st-confirm { border: 1px solid var(--bad); background: var(--bad-tint); padding: 18px 20px; max-width: 420px; margin-top: 16px; }
        .st-confirm p { font-size: 12px; color: var(--bad); margin-bottom: 10px; }
        .st-confirm input { width: 100%; margin-bottom: 12px; }
      `}</style>

      <div className="st-block" style={{ borderTop: "none", paddingTop: 0 }}>
        <div className="st-label">Profile</div>

        <div className="st-avatar-row">
          {image ? (
            <img className="st-avatar" src={image} alt="" />
          ) : (
            <span className="st-avatar-fallback">{initial}</span>
          )}
          <div className="st-avatar-actions">
            <button
              type="button"
              className="st-avatar-btn"
              onClick={() => setEditingImage((v) => !v)}
            >
              {editingImage ? "Cancel" : "Change photo"}
            </button>
            <span className="st-avatar-note">
              {providers.includes("google") && !editingImage
                ? "Synced from your Google account"
                : "Shown across Meterly"}
            </span>
          </div>
        </div>

        {editingImage && (
          <div className="st-image-edit">
            <div className="st-image-edit-row">
              <input
                className="st-input"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://…"
              />
            </div>
            <span className="st-hint">
              Paste an image URL, or clear the field and save to fall back to your account initial.
            </span>
          </div>
        )}

        <div className="st-field" style={{ marginTop: 20 }}>
          <label>Name</label>
          <input
            className="st-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
          />
        </div>
        <div className="st-field">
          <label>Email</label>
          <input className="st-input" value={email} disabled />
        </div>
        <div className="st-row">
          <button className="btn btn-brass" onClick={saveProfile} disabled={saving || !name.trim()}>
            {saving ? "Saving…" : "Save changes"}
          </button>
          {saved && <span className="st-saved">Saved</span>}
        </div>
        {error && !confirmOpen && <div className="st-error">{error}</div>}
      </div>

      <div className="st-block">
        <div className="st-label">Connected accounts</div>
        {providers.length === 0 ? (
          <span className="st-conn-empty">No connected accounts found.</span>
        ) : (
          providers.map((p) => (
            <div key={p} className="st-conn-row">
              <div className="st-conn-left">
                <span className="st-conn-icon">{PROVIDER_LABEL[p]?.[0] ?? p[0]?.toUpperCase()}</span>
                <div>
                  <div className="st-conn-name">{PROVIDER_LABEL[p] ?? p}</div>
                  {connectedSince && <div className="st-conn-since">Connected {connectedSince}</div>}
                </div>
              </div>
              <span className="st-conn-badge">
                <span className="st-conn-dot" />
                Connected
              </span>
            </div>
          ))
        )}
      </div>

      <div className="st-block">
        <div className="st-danger-title">Delete account</div>
        <p className="st-danger-copy">
          Permanently deletes your account, API keys, usage history, saved
          analyses, and billing history. This can't be undone.
        </p>

        {!confirmOpen ? (
          <button className="btn btn-quiet" onClick={() => setConfirmOpen(true)}>
            Delete my account
          </button>
        ) : (
          <div className="st-confirm">
            <p>Type DELETE to confirm. This is permanent.</p>
            <input
              className="st-input"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
            />
            <div className="st-row">
              <button
                className="btn btn-brass"
                style={{ background: "var(--bad)" }}
                onClick={deleteAccount}
                disabled={confirmText !== "DELETE" || deleting}
              >
                {deleting ? "Deleting…" : "Permanently delete"}
              </button>
              <button className="btn btn-line" onClick={() => { setConfirmOpen(false); setConfirmText(""); }}>
                Cancel
              </button>
            </div>
            {error && <div className="st-error">{error}</div>}
          </div>
        )}
      </div>
    </div>
  );
}