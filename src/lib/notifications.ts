import { supabase } from '@/integrations/supabase/client';

type NotificationType = 'membership_expiry' | 'payment_reminder' | 'class_reminder' | 'system_announcement';

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  priority?: 'low' | 'normal' | 'high';
}

export const createNotification = async ({
  userId,
  title,
  message,
  type,
  link,
  priority = 'normal',
}: CreateNotificationParams) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        link,
        priority,
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return { data: null, error };
  }
};

// Helper functions to create specific notification types
export const notifyMembershipExpiry = async (userId: string, daysLeft: number) => {
  return createNotification({
    userId,
    title: 'Membership Expiring Soon',
    message: `Your membership will expire in ${daysLeft} days. Please renew to continue enjoying our services.`,
    type: 'membership_expiry',
    link: '/member/plan',
    priority: 'high',
  });
};

export const notifyPaymentReminder = async (userId: string, amount: number) => {
  return createNotification({
    userId,
    title: 'Payment Reminder',
    message: `You have a pending payment of $${amount}. Please complete your payment.`,
    type: 'payment_reminder',
    link: '/member/payments',
    priority: 'high',
  });
};

export const notifySystemAnnouncement = async (userIds: string[], title: string, message: string) => {
  const notifications = userIds.map(userId => ({
    user_id: userId,
    title,
    message,
    type: 'system_announcement' as NotificationType,
    priority: 'normal' as const,
  }));

  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error creating announcements:', error);
    return { data: null, error };
  }
};

export const notifyNewMemberAdded = async (adminUserIds: string[], memberName: string) => {
  const notifications = adminUserIds.map(userId => ({
    user_id: userId,
    title: 'New Member Added',
    message: `${memberName} has been added to the system.`,
    type: 'system_announcement' as NotificationType,
    priority: 'normal' as const,
  }));

  try {
    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('Error creating member notification:', error);
    return { error };
  }
};

export const notifyStaffAdded = async (adminUserIds: string[], staffName: string) => {
  const notifications = adminUserIds.map(userId => ({
    user_id: userId,
    title: 'New Staff Member',
    message: `${staffName} has been added as a staff member.`,
    type: 'system_announcement' as NotificationType,
    priority: 'normal' as const,
  }));

  try {
    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('Error creating staff notification:', error);
    return { error };
  }
};

export const notifyLogin = async (userId: string, isFirstLogin: boolean = false) => {
  return createNotification({
    userId,
    title: isFirstLogin ? 'Welcome!' : 'Login Successful',
    message: isFirstLogin 
      ? 'Welcome to FitFlow! Complete your profile to get started.'
      : `Login successful at ${new Date().toLocaleString()}`,
    type: 'system_announcement',
    link: isFirstLogin ? '/member/profile' : undefined,
    priority: 'low',
  });
};
