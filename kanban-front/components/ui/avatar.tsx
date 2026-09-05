import { cn } from "@/lib/cn";
import { colorFromId, initialsFromEmail } from "@/lib/color";

type Props = {
  email: string;
  id?: string;
  size?: "sm" | "md";
  className?: string;
};

export function Avatar({ email, id, size = "md", className }: Props) {
  const initials = initialsFromEmail(email);
  return (
    <span
      title={email}
      className={cn(
        "inline-flex items-center justify-center rounded-full text-[10px] font-semibold text-black",
        size === "sm" ? "size-6" : "size-8",
        className,
      )}
      style={{ backgroundColor: colorFromId(id ?? email) }}
    >
      {initials}
    </span>
  );
}
