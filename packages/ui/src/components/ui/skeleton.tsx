import { cn } from "@ui/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-brand-gray-400/40", className)}
      {...props}
    />
  );
}

export { Skeleton };
