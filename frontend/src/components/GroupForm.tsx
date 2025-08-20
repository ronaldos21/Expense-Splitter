import { useState } from "react";
import api from "../lib/api";

type Props = { onCreated?: () => void };

export default function GroupForm({ onCreated }: Props) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post("/groups", { name });
      setName("");
      onCreated?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Failed to create group: ${msg}`);
    } finally {
      setBusy(false);
    }
  };

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
