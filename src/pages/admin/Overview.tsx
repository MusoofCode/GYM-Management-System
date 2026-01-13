import { StatsCard } from "@/components/StatsCard";
import { MembersList } from "@/components/MembersList";
import { ClassSchedule } from "@/components/ClassSchedule";
import { Users, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import heroImage from "@/assets/gym-hero.jpg";

export default function AdminOverview() {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative h-[250px] overflow-hidden rounded-xl"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent z-10" />
        <img 
          src={heroImage} 
          alt="Gym Hero" 
          className="absolute inset-0 w-full h-full object-cover rounded-xl"
        />
        <div className="relative z-20 h-full flex flex-col justify-center px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-5xl font-black text-foreground mb-3 tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-lg text-muted-foreground font-medium">
              Monitor and manage your gym's performance
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Active Members"
          value="1,248"
          icon={Users}
          trend="12% from last month"
          trendUp={true}
          delay={0.1}
        />
        <StatsCard
          title="Today's Classes"
          value="24"
          icon={Calendar}
          trend="3 more than yesterday"
          trendUp={true}
          delay={0.2}
        />
        <StatsCard
          title="Monthly Revenue"
          value="$52,430"
          icon={DollarSign}
          trend="8% from last month"
          trendUp={true}
          delay={0.3}
        />
        <StatsCard
          title="Avg Attendance"
          value="87%"
          icon={TrendingUp}
          trend="5% from last week"
          trendUp={true}
          delay={0.4}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <MembersList />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <ClassSchedule />
        </motion.div>
      </div>
    </div>
  );
}
