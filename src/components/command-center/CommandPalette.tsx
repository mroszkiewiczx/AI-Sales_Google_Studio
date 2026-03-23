export function CommandPalette({ open, onOpenChange }: { open: boolean, onOpenChange: (o: boolean) => void }) {
  if (!open) return null;
  const commands = [
    { label: "Przełącz na Gemini Flash", action: () => { console.log("Switching to Gemini Flash"); onOpenChange(false); } },
    { label: "Przełącz na Whisper v1", action: () => { console.log("Switching to Whisper v1"); onOpenChange(false); } },
  ];
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => onOpenChange(false)}>
      <div className="bg-background p-6 rounded-lg w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">Command Palette</h2>
        <ul className="space-y-2">
          {commands.map((cmd, i) => (
            <li key={i}>
              <button className="w-full text-left p-2 hover:bg-accent rounded" onClick={cmd.action}>
                {cmd.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
