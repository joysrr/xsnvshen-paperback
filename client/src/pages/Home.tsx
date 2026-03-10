import { useHealth } from "@/hooks/use-health";
import { StatusBadge } from "@/components/StatusBadge";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { motion } from "framer-motion";
import { ArrowRight, Code2, Layers, RefreshCcw, Zap } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export default function Home() {
  const { data, isLoading, isError, isFetching } = useHealth();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: [api.health.check.path] });
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    },
  };

  // Determine actual status based on query state
  const status = isLoading || isFetching ? "loading" : isError ? "disconnected" : "connected";

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-grain">
      <AnimatedBackground />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 z-0 bg-grid-pattern opacity-50" />

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-3xl px-6 py-20 flex flex-col items-center text-center">
        
        <motion.div
          initial="hidden"
          animate="show"
          variants={container}
          className="flex flex-col items-center"
        >
          {/* Status Indicator Area */}
          <motion.div variants={item} className="mb-12 cursor-pointer group" onClick={handleRefresh}>
            <StatusBadge 
              status={status} 
              message={
                status === "connected" ? `API: ${data?.status || 'OK'}` : 
                status === "loading" ? 'Checking API...' : 'Connection Error'
              } 
            />
            <div className="mt-2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
              <RefreshCcw className="w-3 h-3" /> Click to refresh
            </div>
          </motion.div>

          {/* Hero Typography */}
          <motion.h1 
            variants={item}
            className="text-5xl md:text-7xl font-semibold tracking-tighter text-foreground mb-6"
          >
            Design <span className="text-muted-foreground font-light italic">Engineered.</span>
          </motion.h1>

          <motion.p 
            variants={item}
            className="text-lg md:text-xl text-muted-foreground max-w-lg mb-12 font-light leading-relaxed"
          >
            You are currently viewing a production-ready React foundation. The architecture is minimal, resilient, and beautifully crafted.
          </motion.p>

          {/* Interactive Elements / Call to Actions */}
          <motion.div variants={item} className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            <button className="group relative px-6 py-3 bg-primary text-primary-foreground rounded-full text-sm font-medium transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/20 active:scale-95 flex items-center gap-2 overflow-hidden">
              <span className="relative z-10 flex items-center gap-2">
                Start Building <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0" />
            </button>
            
            <button className="px-6 py-3 bg-secondary text-secondary-foreground border border-border/50 rounded-full text-sm font-medium transition-all hover:bg-muted hover:border-border active:scale-95">
              Read Documentation
            </button>
          </motion.div>

          {/* Feature Micro-cards */}
          <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 w-full text-left">
            <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
              <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                <Code2 className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Type-Safe Contract</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">End-to-end type safety with Zod schemas validating every API boundary.</p>
            </div>
            
            <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
              <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Clean Architecture</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Separation of concerns enforced by design. Minimal, predictable data flow.</p>
            </div>
            
            <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
              <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Uncompromising UI</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Motion-enhanced interfaces that feel premium down to the last pixel.</p>
            </div>
          </motion.div>

        </motion.div>
      </div>
      
      {/* Footer minimal signature */}
      <div className="absolute bottom-6 w-full text-center z-10">
        <p className="text-xs text-muted-foreground/50 font-mono uppercase tracking-widest">
          Status: <span className={status === "connected" ? "text-[hsl(var(--status-success))]" : ""}>{status}</span>
        </p>
      </div>
    </main>
  );
}
