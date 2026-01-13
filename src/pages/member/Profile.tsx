import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

export default function MemberProfile() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground mt-2">Manage your personal information</p>
      </div>

      <Card className="p-6">
        <p className="text-muted-foreground">Profile management features coming soon...</p>
      </Card>
    </motion.div>
  );
}
