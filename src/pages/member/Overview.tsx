import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, QrCode, Activity } from "lucide-react";

export default function MemberOverview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-foreground">Welcome Back!</h1>
        <p className="text-muted-foreground mt-2">Track your fitness journey</p>
      </div>

      {/* Membership Card */}
      <Card className="p-6 bg-gradient-primary text-primary-foreground shadow-premium">
        <div className="flex items-start justify-between">
          <div>
            <Badge className="mb-3 bg-primary-foreground/20 text-primary-foreground">
              Active Membership
            </Badge>
            <h2 className="text-2xl font-bold mb-1">Premium Plan</h2>
            <p className="text-primary-foreground/80">Valid until: Dec 31, 2024</p>
          </div>
          <div className="p-3 bg-primary-foreground/20 rounded-lg">
            <QrCode className="w-12 h-12" />
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Classes This Month</p>
              <p className="text-2xl font-bold text-foreground">12</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-success/10 rounded-lg">
              <Activity className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Check-ins</p>
              <p className="text-2xl font-bold text-foreground">24</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-warning/10 rounded-lg">
              <Calendar className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Days Left</p>
              <p className="text-2xl font-bold text-foreground">45</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-foreground mb-4">Recent Activity</h3>
        <p className="text-muted-foreground">Activity tracking coming soon...</p>
      </Card>
    </motion.div>
  );
}
