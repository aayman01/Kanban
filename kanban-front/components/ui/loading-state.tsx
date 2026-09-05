type Props = {
  label: string;
};

export function LoadingState({ label }: Props) {
  return (
    <div className="flex flex-col gap-4 p-8">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex gap-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-40 w-64 rounded-2xl bg-card" />
        ))}
      </div>
    </div>
  );
}
