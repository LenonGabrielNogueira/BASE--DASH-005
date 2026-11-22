export default function Carregando() {
  return (
    <div
      role="status"
      aria-label="Carregando"
      className="space-y-5 animate-pulse"
    >
      <div className="h-8 w-48 rounded bg-slate-200" />
      <p className="text-sm text-slate-500">Carregando cadastros…</p>
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 rounded-xl bg-slate-200" />
      ))}
    </div>
  );
}
