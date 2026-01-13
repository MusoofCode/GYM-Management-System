import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GymClass {
  id: string;
  name: string;
  instructor: string;
  time: string;
  duration: string;
  capacity: number;
  enrolled: number;
  type: string;
}

const mockClasses: GymClass[] = [
  { id: "1", name: "HIIT Training", instructor: "Marcus Steel", time: "06:00 AM", duration: "45 min", capacity: 20, enrolled: 18, type: "Cardio" },
  { id: "2", name: "Yoga Flow", instructor: "Lily Chen", time: "08:00 AM", duration: "60 min", capacity: 15, enrolled: 12, type: "Flexibility" },
  { id: "3", name: "Power Lifting", instructor: "Jake Thompson", time: "10:00 AM", duration: "90 min", capacity: 12, enrolled: 10, type: "Strength" },
  { id: "4", name: "Spin Class", instructor: "Sarah Adams", time: "05:00 PM", duration: "45 min", capacity: 25, enrolled: 24, type: "Cardio" },
  { id: "5", name: "Boxing Basics", instructor: "Tony Rivera", time: "07:00 PM", duration: "60 min", capacity: 16, enrolled: 14, type: "Combat" },
];

export const ClassSchedule = () => {
  return (
    <Card className="p-6 shadow-card border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Today's Classes</h2>
          <p className="text-sm text-muted-foreground mt-1">Schedule and attendance</p>
        </div>
        <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold">
          View Full Schedule
        </Button>
      </div>

      <div className="space-y-3">
        {mockClasses.map((gymClass, index) => {
          const capacityPercentage = (gymClass.enrolled / gymClass.capacity) * 100;
          const isAlmostFull = capacityPercentage >= 80;
          
          return (
            <motion.div
              key={gymClass.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-primary/20"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-foreground">{gymClass.name}</h3>
                    <Badge variant="secondary" className="text-xs bg-secondary/20 text-secondary-foreground">
                      {gymClass.type}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    with <span className="text-foreground font-medium">{gymClass.instructor}</span>
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{gymClass.time} • {gymClass.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      <span className={isAlmostFull ? "text-warning font-semibold" : "text-muted-foreground"}>
                        {gymClass.enrolled}/{gymClass.capacity}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${isAlmostFull ? 'bg-warning' : 'bg-primary'}`}
                      style={{ width: `${capacityPercentage}%` }}
                    />
                  </div>
                  {isAlmostFull && (
                    <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/20">
                      Almost Full
                    </Badge>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
};
