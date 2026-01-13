import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

export default function AdminPayments() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-foreground">Payments & Billing</h1>
        <p className="text-muted-foreground mt-2">Track payments and generate invoices</p>
      </div>

      <Card className="p-6">
        <p className="text-muted-foreground">Payment management features coming soon...</p>
      </Card>
    </motion.div>
  );
}
