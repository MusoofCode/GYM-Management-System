import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

export default function AdminSettings() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Configure your gym settings</p>
      </div>

      <Card className="p-6">
        <p className="text-muted-foreground">Settings features coming soon...</p>
      </Card>
    </motion.div>
  );
}
