export function RobotGuide({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center shadow-lg">
        <span className="text-3xl">🤖</span>
      </div>
      <div className="relative bg-white border-2 border-sky-200 rounded-2xl px-4 py-3 shadow-sm">
        <div className="absolute -left-2 top-4 w-3 h-3 bg-white border-l-2 border-b-2 border-sky-200 rotate-45" />
        <p className="text-slate-700">{message}</p>
      </div>
    </div>
  );
}
