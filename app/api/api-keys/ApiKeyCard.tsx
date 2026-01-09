"use client";

import { useEffect, useState } from "react";
import ApiKeyCard from "./ApiKeyCard";

type ApiKey = {
  id: string;
  name: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState<string | null>(null);

  async function fetchKeys() {
    setLoading(true);
    const res = await fetch("/api/api-keys");
    const data = await res.json();
    setKeys(data);
    setLoading(false);
  }

  async function createKey() {
    const name = prompt("API key name (e.g. Production)");
    if (!name) return;

    const res = await fetch("/api/api-keys", {
      method: "POST",
      body: JSON.stringify({ name }),
    });

    const data = await res.json();
    setNewKey(data.apiKey); // show only once
    fetchKeys();
  }

  async function revokeKey(id: string) {
    if (!confirm("Revoke this API key?")) return;

    await fetch("/api/api-keys", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });

    fetchKeys();
  }

  useEffect(() => {
    fetchKeys();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">API Keys</h1>
        <button
          onClick={createKey}
          className="rounded-md bg-white px-4 py-2 text-black font-medium"
        >
          Generate Key
        </button>
      </div>

      {loading && <p className="text-gray-400">Loading...</p>}

      {!loading && keys.length === 0 && (
        <p className="text-gray-400">No API keys created yet.</p>
      )}

      <div className="grid gap-4">
        {keys.map((key) => (
          <ApiKeyCard
            key={key.id}
            apiKey={key}
            onRevoke={() => revokeKey(key.id)}
          />
        ))}
      </div>

      {/* COPY MODAL (SHOW ONLY ONCE) */}
      {newKey && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-neutral-900 p-6 rounded-lg w-full max-w-md space-y-4">
            <h2 className="text-lg font-semibold">New API Key</h2>

            <p className="text-sm text-yellow-400">
              Copy this key now. You won’t see it again.
            </p>

            <div className="flex items-center gap-2">
              <code className="flex-1 bg-black p-2 rounded text-sm overflow-x-auto">
                {newKey}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(newKey)}
                className="px-3 py-2 bg-white text-black rounded"
              >
                Copy
              </button>
            </div>

            <button
              onClick={() => setNewKey(null)}
              className="w-full bg-neutral-800 py-2 rounded"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
