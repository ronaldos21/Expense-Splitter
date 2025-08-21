// src/components/GroupList.tsx
type Group = { id: number; name: string; created_at: string };

export default function GroupList({
  groups,
  onDelete,
}: {
  groups: Group[];
  onDelete?: (id: number) => void;
}) {
  if (!groups.length) {
    return (
      <div className="rounded border border-dashed p-4 text-sm text-neutral-500">
        No groups yet. Create one above.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {groups.map((g) => (
        <li
          key={g.id}
          className="rounded border p-3 flex items-center justify-between"
        >
          <div>
            <div className="font-medium">{g.name}</div>
            <div className="text-xs text-neutral-500">
              {new Date(g.created_at).toLocaleString()}
            </div>
          </div>
          {onDelete && (
            <button
              className="text-xs text-rose-600 hover:underline"
              onClick={() => onDelete(g.id)}
            >
              Delete
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
