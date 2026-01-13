import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

export default function AdminClasses() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-foreground">Classes & Scheduling</h1>
        <p className="text-muted-foreground mt-2">Manage gym classes and schedules</p>
      </div>

      <Card className="p-6">
        <p className="text-muted-foreground">Class management features coming soon...</p>
      </Card>
    </motion.div>
  );
}
