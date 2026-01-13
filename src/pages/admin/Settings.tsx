import { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Building2, Bell, Lock, Database, Loader2 } from 'lucide-react';

interface SystemSettings {
  gym_name: string;
  gym_address: string;
  gym_phone: string;
  gym_email: string;
  gym_logo_url: string;
  business_hours: string;
  membership_freeze_max_days: number;
  late_payment_grace_days: number;
  enable_email_notifications: boolean;
  enable_sms_notifications: boolean;
  enable_auto_backup: boolean;
  backup_frequency: string;
}

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [settings, setSettings] = useState<SystemSettings>({
    gym_name: 'FitFlow Gym',
    gym_address: '',
    gym_phone: '',
    gym_email: '',
    gym_logo_url: '',
    business_hours: '6:00 AM - 10:00 PM',
    membership_freeze_max_days: 30,
    late_payment_grace_days: 7,
    enable_email_notifications: true,
    enable_sms_notifications: false,
    enable_auto_backup: true,
    backup_frequency: 'daily'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');

      if (error) throw error;

      if (data && data.length > 0) {
        // Merge all settings into one object
        const settingsObj: any = {};
        data.forEach(setting => {
          settingsObj[setting.setting_key] = setting.setting_value;
        });
        
        setSettings(prev => ({
          ...prev,
          ...settingsObj
        }));
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save each setting individually
      const settingsToSave = Object.entries(settings).map(([key, value]) => ({
        setting_key: key,
        setting_value: value,
        description: getSettingDescription(key)
      }));

      for (const setting of settingsToSave) {
        const { error } = await supabase
          .from('system_settings')
          .upsert(setting, { onConflict: 'setting_key' });

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Settings saved successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const getSettingDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      gym_name: 'Name of the gym',
      gym_address: 'Physical address',
      gym_phone: 'Contact phone number',
      gym_email: 'Contact email address',
      gym_logo_url: 'URL to gym logo',
      business_hours: 'Operating hours',
      membership_freeze_max_days: 'Maximum days a membership can be frozen',
      late_payment_grace_days: 'Grace period for late payments',
      enable_email_notifications: 'Enable email notifications',
      enable_sms_notifications: 'Enable SMS notifications',
      enable_auto_backup: 'Enable automatic database backups',
      backup_frequency: 'Frequency of automatic backups'
    };
    return descriptions[key] || '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">System Settings</h1>
          <p className="text-muted-foreground mt-2">Configure your gym management system</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-primary text-primary-foreground font-semibold shadow-premium"
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>

      {loading ? (
        <Card className="p-12">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </Card>
      ) : (
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="policies" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Policies
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Backup
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-foreground">General Information</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gymName">Gym Name</Label>
                  <Input
                    id="gymName"
                    value={settings.gym_name}
                    onChange={(e) => setSettings({ ...settings, gym_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gymAddress">Address</Label>
                  <Textarea
                    id="gymAddress"
                    value={settings.gym_address}
                    onChange={(e) => setSettings({ ...settings, gym_address: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gymPhone">Phone</Label>
                    <Input
                      id="gymPhone"
                      type="tel"
                      value={settings.gym_phone}
                      onChange={(e) => setSettings({ ...settings, gym_phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gymEmail">Email</Label>
                    <Input
                      id="gymEmail"
                      type="email"
                      value={settings.gym_email}
                      onChange={(e) => setSettings({ ...settings, gym_email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessHours">Business Hours</Label>
                  <Input
                    id="businessHours"
                    value={settings.business_hours}
                    onChange={(e) => setSettings({ ...settings, business_hours: e.target.value })}
                    placeholder="e.g., 6:00 AM - 10:00 PM"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    value={settings.gym_logo_url}
                    onChange={(e) => setSettings({ ...settings, gym_logo_url: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Notification Settings</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailNotif">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send email notifications for membership renewals, payments, etc.
                    </p>
                  </div>
                  <Switch
                    id="emailNotif"
                    checked={settings.enable_email_notifications}
                    onCheckedChange={(checked) => 
                      setSettings({ ...settings, enable_email_notifications: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="smsNotif">SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send SMS alerts for important updates (requires SMS gateway)
                    </p>
                  </div>
                  <Switch
                    id="smsNotif"
                    checked={settings.enable_sms_notifications}
                    onCheckedChange={(checked) => 
                      setSettings({ ...settings, enable_sms_notifications: checked })
                    }
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="policies">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Business Policies</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="freezeDays">Maximum Membership Freeze Days</Label>
                  <Input
                    id="freezeDays"
                    type="number"
                    min="0"
                    value={settings.membership_freeze_max_days}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      membership_freeze_max_days: parseInt(e.target.value) || 0 
                    })}
                  />
                  <p className="text-sm text-muted-foreground">
                    Maximum number of days a member can freeze their membership
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="graceDays">Late Payment Grace Period (Days)</Label>
                  <Input
                    id="graceDays"
                    type="number"
                    min="0"
                    value={settings.late_payment_grace_days}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      late_payment_grace_days: parseInt(e.target.value) || 0 
                    })}
                  />
                  <p className="text-sm text-muted-foreground">
                    Days after due date before marking membership as expired
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="backup">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Backup & Data Management</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoBackup">Automatic Backups</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically backup database at scheduled intervals
                    </p>
                  </div>
                  <Switch
                    id="autoBackup"
                    checked={settings.enable_auto_backup}
                    onCheckedChange={(checked) => 
                      setSettings({ ...settings, enable_auto_backup: checked })
                    }
                  />
                </div>
                {settings.enable_auto_backup && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label>Backup Frequency</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {['daily', 'weekly', 'monthly'].map(freq => (
                          <Button
                            key={freq}
                            type="button"
                            variant={settings.backup_frequency === freq ? 'default' : 'outline'}
                            onClick={() => setSettings({ ...settings, backup_frequency: freq })}
                            className="capitalize"
                          >
                            {freq}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                <Separator />
                <div className="space-y-2">
                  <Label>Manual Backup</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Create a backup of your database right now
                  </p>
                  <Button variant="outline">
                    <Database className="w-4 h-4 mr-2" />
                    Create Backup Now
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </motion.div>
  );
}
