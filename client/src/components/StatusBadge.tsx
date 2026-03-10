import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Server, ServerOff, Loader2 } from "lucide-react";

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: "connected" | "disconnected" | "loading";
  message?: string;
}

export const StatusBadge = forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ className, status, message, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all duration-300 backdrop-blur-sm",
          status === "connected" && "bg-[hsl(var(--status-success-bg))] border-[hsl(var(--status-success)_/_0.2)] text-[hsl(var(--status-success))]",
          status === "disconnected" && "bg-[hsl(var(--status-error-bg))] border-[hsl(var(--status-error)_/_0.2)] text-[hsl(var(--status-error))]",
          status === "loading" && "bg-muted/50 border-border/50 text-muted-foreground",
          className
        )}
        {...props}
      >
        <span className="relative flex h-2 w-2">
          {status === "connected" && (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--status-success))] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(var(--status-success))]"></span>
            </>
          )}
          {status === "disconnected" && (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(var(--status-error))]"></span>
          )}
          {status === "loading" && (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-muted-foreground"></span>
          )}
        </span>
        
        <span className="font-mono text-xs uppercase tracking-wider mt-0.5">
          {status === "connected" && (message || "Systems Operational")}
          {status === "disconnected" && (message || "Connection Lost")}
          {status === "loading" && (message || "Connecting...")}
        </span>
        
        {status === "connected" && <Server className="w-3.5 h-3.5 ml-1 opacity-70" />}
        {status === "disconnected" && <ServerOff className="w-3.5 h-3.5 ml-1 opacity-70" />}
        {status === "loading" && <Loader2 className="w-3.5 h-3.5 ml-1 opacity-70 animate-spin" />}
      </div>
    );
  }
);

StatusBadge.displayName = "StatusBadge";
