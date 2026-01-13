import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

export default function AdminProducts() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-foreground">Products & Inventory</h1>
        <p className="text-muted-foreground mt-2">Manage gym products and stock</p>
      </div>

      <Card className="p-6">
        <p className="text-muted-foreground">Product management features coming soon...</p>
      </Card>
    </motion.div>
  );
}
