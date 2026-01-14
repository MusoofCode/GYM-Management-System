import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { PhotoUpload } from './PhotoUpload';
import { uploadStudentPhoto, deleteStudentPhoto } from '@/lib/imageCompression';

interface Member {
  user_id: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
}

interface EditMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
  onSuccess: () => void;
}

export const EditMemberDialog = ({ open, onOpenChange, member, onSuccess }: EditMemberDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
  });

  useEffect(() => {
    if (member) {
      setPhotoFile(null);
      setRemovePhoto(false);
      setFormData({
        fullName: member.full_name || '',
        phone: member.phone || '',
        dateOfBirth: member.date_of_birth || '',
        address: member.address || '',
        emergencyContact: member.emergency_contact || '',
        emergencyPhone: member.emergency_phone || '',
      });
    }
  }, [member]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    setLoading(true);

    try {
      // Handle photo upload/removal
      let avatarUrl = member.avatar_url;
      
      if (removePhoto && member.avatar_url) {
        // Delete old photo
        try {
          await deleteStudentPhoto(member.avatar_url);
          avatarUrl = null;
        } catch (photoError) {
          console.error('Photo deletion error:', photoError);
        }
      } else if (photoFile) {
        // Delete old photo if exists
        if (member.avatar_url) {
          try {
            await deleteStudentPhoto(member.avatar_url);
          } catch (photoError) {
            console.error('Photo deletion error:', photoError);
          }
        }
        // Upload new photo
        try {
          avatarUrl = await uploadStudentPhoto(photoFile, member.user_id);
        } catch (photoError) {
          console.error('Photo upload error:', photoError);
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          phone: formData.phone || null,
          date_of_birth: formData.dateOfBirth || null,
          address: formData.address || null,
          emergency_contact: formData.emergencyContact || null,
          emergency_phone: formData.emergencyPhone || null,
          avatar_url: avatarUrl,
        })
        .eq('user_id', member.user_id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Member updated successfully',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update member',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Member</DialogTitle>
          <DialogDescription>
            Update member information. Email cannot be changed.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {member && (
            <PhotoUpload
              currentPhotoUrl={member.avatar_url}
              userName={formData.fullName || member.full_name}
              onPhotoSelected={(file) => {
                setPhotoFile(file);
                setRemovePhoto(false);
              }}
              onPhotoRemoved={() => {
                setPhotoFile(null);
                setRemovePhoto(true);
              }}
              disabled={loading}
            />
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                disabled
                value={member?.email || ''}
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyContact">Emergency Contact</Label>
              <Input
                id="emergencyContact"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyPhone">Emergency Phone</Label>
              <Input
                id="emergencyPhone"
                type="tel"
                value={formData.emergencyPhone}
                onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
