import { useState } from "react";
import api from "../lib/api";

type Group = { id: number; name: string; created_at?: string };

type Props = {
  // Optimistic hooks provided by parent (GroupList/App)
  onOptimisticAdd: (temp: Group) => void;
  onCommit: (tempId: number, real: Group) => void;
  onError?: (tempId: number, err: unknown) => void;

  // Optional: keep your previous “refresh” if you still want it
  onCreated?: () => void;
};

export default function GroupForm({
  onOptimisticAdd,
  onCommit,
  onError,
  onCreated,
}: Props) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setBusy(true);
    setError(null);

    // 1) Add a TEMP group instantly
    const tempId = -Date.now();
    const tempGroup: Group = { id: tempId, name: name.trim() };
    onOptimisticAdd(tempGroup);

    try {
      // 2) Call the server
      const res = await api.post<Group>("/groups", { name: name.trim() });
      const real = res.data;

      // 3) Replace the TEMP group with the real one
      onCommit(tempId, real);

      setName("");
      onCreated?.(); // optional refresh you already had
    } catch (err) {
      // 4) Rollback if it failed
      setError("Failed to create group.");
      onError?.(tempId, err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input
        className="border rounded px-2 py-1"
        placeholder="Group name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <button
        className="rounded bg-black text-white px-3 py-1 disabled:opacity-50"
        disabled={busy}
      >
        {busy ? "Creating…" : "Create"}
      </button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </form>
  );
}
