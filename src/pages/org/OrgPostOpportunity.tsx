import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router";

import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/AppShell";
import { ClayButton } from "@/components/clay";
import OpportunityForm from "./OpportunityForm";

export default function OrgPostOpportunity() {
  const { id } = useParams();
  const isEdit = !!id;
  const existing = useQuery(api.opportunities.get, isEdit ? { id: id as never } : "skip");

  return (
    <AppShell className="max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <ClayButton asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link to="/org/opportunities">
            <ArrowLeft /> Back to opportunities
          </Link>
        </ClayButton>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">
          {isEdit ? "Edit opportunity" : "Post an opportunity"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isEdit
            ? "Update the details — changes are visible to volunteers immediately."
            : "Describe the role and set eligibility criteria. Fasha will match it to the right volunteers."}
        </p>
        {isEdit && existing && (
          <p className="mt-2 inline-block rounded-full bg-butter px-3 py-1 text-xs font-bold text-yellow-800">
            Editing: {existing.title}
          </p>
        )}
      </motion.div>

      <div className="mt-6">
        <OpportunityForm />
      </div>
    </AppShell>
  );
}
