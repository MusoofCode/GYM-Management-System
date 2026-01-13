-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'trainer', 'member');

-- Create enum for membership status
CREATE TYPE public.membership_status AS ENUM ('active', 'expired', 'pending', 'frozen');

-- Create enum for payment methods
CREATE TYPE public.payment_method AS ENUM ('cash', 'card', 'mobile_money', 'bank_transfer');

-- Create enum for payment types
CREATE TYPE public.payment_type AS ENUM ('membership', 'personal_training', 'product', 'other');

-- Create enum for class booking status
CREATE TYPE public.booking_status AS ENUM ('confirmed', 'cancelled', 'waitlist', 'completed');

-- Create enum for notification types
CREATE TYPE public.notification_type AS ENUM ('membership_expiry', 'payment_reminder', 'class_reminder', 'system_announcement');

-- User Roles Table (CRITICAL SECURITY)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Security Definer Function for Role Checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles Table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    date_of_birth DATE,
    address TEXT,
    emergency_contact TEXT,
    emergency_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Membership Plans Table
CREATE TABLE public.membership_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    duration_months INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    features TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Memberships Table
CREATE TABLE public.memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.membership_plans(id) ON DELETE RESTRICT,
    status membership_status DEFAULT 'pending',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    qr_code TEXT UNIQUE,
    freeze_start_date DATE,
    freeze_end_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Attendance Table
CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    check_in_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
    check_out_time TIMESTAMP WITH TIME ZONE,
    qr_code_scanned TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Trainers Table
CREATE TABLE public.trainers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    specialization TEXT[],
    bio TEXT,
    certifications TEXT[],
    experience_years INTEGER,
    hourly_rate DECIMAL(10, 2),
    availability JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Classes Table
CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    trainer_id UUID REFERENCES public.trainers(id) ON DELETE SET NULL,
    capacity INTEGER NOT NULL,
    duration_minutes INTEGER NOT NULL,
    schedule_day TEXT NOT NULL,
    schedule_time TIME NOT NULL,
    class_type TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Class Bookings Table
CREATE TABLE public.class_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    status booking_status DEFAULT 'confirmed',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (class_id, user_id, booking_date)
);

-- Payments Table
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method payment_method NOT NULL,
    payment_type payment_type NOT NULL,
    reference_id UUID,
    invoice_number TEXT UNIQUE,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    promo_code TEXT,
    notes TEXT,
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Progress Tracking Table
CREATE TABLE public.progress_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    weight DECIMAL(5, 2),
    body_fat_percentage DECIMAL(4, 2),
    bmi DECIMAL(4, 2),
    chest DECIMAL(5, 2),
    waist DECIMAL(5, 2),
    hips DECIMAL(5, 2),
    arms DECIMAL(5, 2),
    thighs DECIMAL(5, 2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Workout Plans Table
CREATE TABLE public.workout_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trainer_id UUID REFERENCES public.trainers(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    exercises JSONB,
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Products Table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    low_stock_alert INTEGER DEFAULT 10,
    sku TEXT UNIQUE,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Notifications Table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL,
    is_read BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Staff and admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'staff') OR
        public.has_role(auth.uid(), 'trainer')
    );

CREATE POLICY "Admins can insert profiles" ON public.profiles
    FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for membership_plans
CREATE POLICY "Everyone can view active plans" ON public.membership_plans
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage plans" ON public.membership_plans
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for memberships
CREATE POLICY "Users can view their own membership" ON public.memberships
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all memberships" ON public.memberships
    FOR SELECT USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'staff')
    );

CREATE POLICY "Staff can manage memberships" ON public.memberships
    FOR ALL USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'staff')
    );

-- RLS Policies for attendance
CREATE POLICY "Users can view their own attendance" ON public.attendance
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own attendance" ON public.attendance
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can view all attendance" ON public.attendance
    FOR SELECT USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'staff')
    );

CREATE POLICY "Staff can manage attendance" ON public.attendance
    FOR ALL USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'staff')
    );

-- RLS Policies for trainers
CREATE POLICY "Everyone can view active trainers" ON public.trainers
    FOR SELECT USING (is_active = true);

CREATE POLICY "Trainers can update their own profile" ON public.trainers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage trainers" ON public.trainers
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for classes
CREATE POLICY "Everyone can view active classes" ON public.classes
    FOR SELECT USING (is_active = true);

CREATE POLICY "Staff can manage classes" ON public.classes
    FOR ALL USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'staff') OR
        public.has_role(auth.uid(), 'trainer')
    );

-- RLS Policies for class_bookings
CREATE POLICY "Users can view their own bookings" ON public.class_bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings" ON public.class_bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel their own bookings" ON public.class_bookings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all bookings" ON public.class_bookings
    FOR SELECT USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'staff') OR
        public.has_role(auth.uid(), 'trainer')
    );

CREATE POLICY "Staff can manage bookings" ON public.class_bookings
    FOR ALL USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'staff')
    );

-- RLS Policies for payments
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all payments" ON public.payments
    FOR SELECT USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'staff')
    );

CREATE POLICY "Staff can create payments" ON public.payments
    FOR INSERT WITH CHECK (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'staff')
    );

-- RLS Policies for progress_tracking
CREATE POLICY "Users can view their own progress" ON public.progress_tracking
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own progress" ON public.progress_tracking
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Trainers can view their clients' progress" ON public.progress_tracking
    FOR SELECT USING (
        public.has_role(auth.uid(), 'trainer') OR
        public.has_role(auth.uid(), 'admin') OR
        public.has_role(auth.uid(), 'staff')
    );

-- RLS Policies for workout_plans
CREATE POLICY "Users can view their own workout plans" ON public.workout_plans
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Trainers can manage workout plans" ON public.workout_plans
    FOR ALL USING (
        public.has_role(auth.uid(), 'trainer') OR
        public.has_role(auth.uid(), 'admin') OR
        public.has_role(auth.uid(), 'staff')
    );

-- RLS Policies for products
CREATE POLICY "Everyone can view active products" ON public.products
    FOR SELECT USING (is_active = true);

CREATE POLICY "Staff can manage products" ON public.products
    FOR ALL USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'staff')
    );

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Staff can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'staff')
    );

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_membership_plans_updated_at BEFORE UPDATE ON public.membership_plans
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON public.memberships
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trainers_updated_at BEFORE UPDATE ON public.trainers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_class_bookings_updated_at BEFORE UPDATE ON public.class_bookings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workout_plans_updated_at BEFORE UPDATE ON public.workout_plans
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX idx_memberships_status ON public.memberships(status);
CREATE INDEX idx_attendance_user_id ON public.attendance(user_id);
CREATE INDEX idx_attendance_check_in_time ON public.attendance(check_in_time);
CREATE INDEX idx_class_bookings_user_id ON public.class_bookings(user_id);
CREATE INDEX idx_class_bookings_class_id ON public.class_bookings(class_id);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);