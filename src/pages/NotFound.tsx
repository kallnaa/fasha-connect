import { motion } from "framer-motion";
import { Compass, Home } from "lucide-react";
import { Link } from "react-router";
import { ClayBlob, ClayButton, ClayCard } from "@/components/clay";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <ClayBlob className="-top-20 -left-20 size-80" color="bg-peach/40" />
        <ClayBlob className="-right-24 bottom-0 size-96" color="bg-mint/40" />
        <ClayBlob className="top-1/3 right-1/3 size-48" color="bg-sky/35" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <ClayCard className="p-10 text-center">
          <span className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-sky/70 shadow-inner">
            <Compass className="size-8 text-[#1e3a52]" />
          </span>
          <h1 className="mt-5 font-display text-6xl font-extrabold tracking-tight">404</h1>
          <p className="mt-2 font-display text-xl font-bold">This path leads nowhere</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Even the best explorers take a wrong turn sometimes.
          </p>
          <ClayButton asChild className="mt-6">
            <Link to="/">
              <Home /> Back to Fasha
            </Link>
          </ClayButton>
        </ClayCard>
      </motion.div>
    </div>
  );
}
