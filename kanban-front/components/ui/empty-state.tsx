import { Button } from "./button";

type Props = {
  eyebrow?: string;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  eyebrow,
  title,
  body,
  actionLabel,
  onAction,
}: Props) {
  return (
    <div className="flex max-w-md flex-col gap-3">
      {eyebrow ? (
        <p className="text-xs text-muted-foreground">{eyebrow}</p>
      ) : null}
      <h2 className="text-lg font-semibold">{title}</h2>
      {body ? (
        <p className="text-sm leading-6 text-muted-foreground">{body}</p>
      ) : null}
      {actionLabel && onAction ? (
        <div>
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      ) : null}
    </div>
  );
}
