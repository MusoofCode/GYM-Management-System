import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";

interface Member {
  id: string;
  name: string;
  email: string;
  status: "active" | "inactive" | "expired";
  membershipType: string;
  joinDate: string;
}

const mockMembers: Member[] = [
  { id: "1", name: "Alex Johnson", email: "alex@example.com", status: "active", membershipType: "Premium", joinDate: "2024-01-15" },
  { id: "2", name: "Sarah Martinez", email: "sarah@example.com", status: "active", membershipType: "Standard", joinDate: "2024-02-20" },
  { id: "3", name: "Mike Chen", email: "mike@example.com", status: "expired", membershipType: "Basic", joinDate: "2023-11-10" },
  { id: "4", name: "Emma Wilson", email: "emma@example.com", status: "active", membershipType: "Premium", joinDate: "2024-01-05" },
  { id: "5", name: "James Brown", email: "james@example.com", status: "inactive", membershipType: "Standard", joinDate: "2023-12-15" },
];

const statusColors = {
  active: "success",
  inactive: "warning",
  expired: "destructive",
};

export const MembersList = () => {
  return (
    <Card className="p-6 shadow-card border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Members</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage your gym members</p>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground font-semibold shadow-premium hover:shadow-premium hover:scale-105 transition-all">
          Add Member
        </Button>
      </div>

      <div className="space-y-3">
        {mockMembers.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-center gap-4 flex-1">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{member.name}</h3>
                  <Badge variant="outline" className={`text-xs bg-${statusColors[member.status]}/10 text-${statusColors[member.status]} border-${statusColors[member.status]}/20`}>
                    {member.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{member.email}</p>
              </div>
              
              <div className="hidden md:flex flex-col items-end gap-1">
                <span className="text-sm font-medium text-foreground">{member.membershipType}</span>
                <span className="text-xs text-muted-foreground">Joined {member.joinDate}</span>
              </div>
            </div>
            
            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </motion.div>
        ))}
      </div>
    </Card>
  );
};
