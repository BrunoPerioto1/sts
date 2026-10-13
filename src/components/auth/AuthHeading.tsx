export function AuthHeading({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex flex-col gap-1.5 pt-10 pb-2.5 lg:pt-7 lg:pb-2">
      <h1 className="text-[28px] lg:text-2xl leading-[1.15] lg:leading-tight font-semibold tracking-[-0.02em]">{title}</h1>
      <p className="text-[14.5px] lg:text-sm text-zinc-400">{sub}</p>
    </div>
  );
}
