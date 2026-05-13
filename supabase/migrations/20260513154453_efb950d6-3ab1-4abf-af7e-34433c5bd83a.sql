
-- App role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.payment_method AS ENUM ('bkash', 'nagad');
CREATE TYPE public.request_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.txn_type AS ENUM ('deposit', 'withdraw', 'income', 'package', 'referral', 'admin_adjust');

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL UNIQUE,
  payment_number TEXT,
  balance NUMERIC NOT NULL DEFAULT 0,
  total_earned NUMERIC NOT NULL DEFAULT 0,
  refer_code TEXT NOT NULL UNIQUE,
  referred_by UUID REFERENCES public.profiles(id),
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- user_roles (separate table — security best practice)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- has_role security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- packages
CREATE TABLE public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  daily_income NUMERIC NOT NULL,
  duration_days INT NOT NULL,
  daily_tasks INT NOT NULL DEFAULT 3,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- user_packages
CREATE TABLE public.user_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.packages(id),
  price_paid NUMERIC NOT NULL,
  daily_income NUMERIC NOT NULL,
  daily_tasks INT NOT NULL,
  duration_days INT NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_claim_date DATE,
  tasks_done_today INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- tasks (ads)
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  ad_url TEXT,
  view_seconds INT NOT NULL DEFAULT 15,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- task_completions
CREATE TABLE public.task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id),
  user_package_id UUID REFERENCES public.user_packages(id),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reward NUMERIC NOT NULL DEFAULT 0
);

-- deposits
CREATE TABLE public.deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method public.payment_method NOT NULL,
  amount NUMERIC NOT NULL,
  transaction_id TEXT NOT NULL,
  status public.request_status NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- withdrawals
CREATE TABLE public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method public.payment_method NOT NULL,
  phone TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status public.request_status NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- referrals
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  commission_earned NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(referred_id)
);

-- transactions (financial history log)
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.txn_type NOT NULL,
  amount NUMERIC NOT NULL,
  balance_after NUMERIC NOT NULL,
  note TEXT,
  ref_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- notices
CREATE TABLE public.notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- payment_settings (singleton)
CREATE TABLE public.payment_settings (
  id INT PRIMARY KEY DEFAULT 1,
  bkash_number TEXT NOT NULL DEFAULT '',
  nagad_number TEXT NOT NULL DEFAULT '',
  min_deposit NUMERIC NOT NULL DEFAULT 500,
  min_withdraw NUMERIC NOT NULL DEFAULT 500,
  referral_percent NUMERIC NOT NULL DEFAULT 10,
  CONSTRAINT singleton CHECK (id = 1)
);

INSERT INTO public.payment_settings (id) VALUES (1);

-- Seed packages (BDT69-style)
INSERT INTO public.packages (name, price, daily_income, duration_days, daily_tasks, sort_order) VALUES
('Silver',  500,   300,  70, 3, 1),
('Silver2', 1000,  600,  70, 6, 2),
('Silver3', 2000,  1200, 90, 12, 3),
('Gold',    5000,  3000, 90, 20, 4),
('Diamond', 10000, 6000, 100, 30, 5);

-- Enable RLS on all
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

-- profiles policies
CREATE POLICY "users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "admin update any profile" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- user_roles policies
CREATE POLICY "users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- packages — public readable
CREATE POLICY "anyone view packages" ON public.packages FOR SELECT USING (true);
CREATE POLICY "admin manage packages" ON public.packages FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- user_packages
CREATE POLICY "users view own packages" ON public.user_packages FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin manage user_packages" ON public.user_packages FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- tasks — public read (active)
CREATE POLICY "anyone view tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "admin manage tasks" ON public.tasks FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- task_completions
CREATE POLICY "users view own completions" ON public.task_completions FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- deposits
CREATE POLICY "users view own deposits" ON public.deposits FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users insert own deposits" ON public.deposits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin manage deposits" ON public.deposits FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- withdrawals
CREATE POLICY "users view own withdrawals" ON public.withdrawals FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin manage withdrawals" ON public.withdrawals FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- referrals
CREATE POLICY "users view own referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id OR public.has_role(auth.uid(), 'admin'));

-- transactions
CREATE POLICY "users view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- notices — public
CREATE POLICY "anyone view notices" ON public.notices FOR SELECT USING (true);
CREATE POLICY "admin manage notices" ON public.notices FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- payment_settings — public read
CREATE POLICY "anyone view payment_settings" ON public.payment_settings FOR SELECT USING (true);
CREATE POLICY "admin update payment_settings" ON public.payment_settings FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Seed welcome notice
INSERT INTO public.notices (message) VALUES ('ClickTaka তে আপনাকে স্বাগতম! প্যাকেজ কিনে দৈনিক ইনকাম শুরু করুন।');

-- Function: generate unique refer code
CREATE OR REPLACE FUNCTION public.generate_refer_code()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  code TEXT;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text || clock_timestamp()::text) for 8));
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE refer_code = code) THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ SET search_path = public;

-- Trigger: auto-create profile + user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_phone TEXT;
  v_name TEXT;
  v_referrer_code TEXT;
  v_referrer_id UUID;
BEGIN
  v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, NEW.email);
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', '');
  v_referrer_code := NEW.raw_user_meta_data->>'refer_code';

  IF v_referrer_code IS NOT NULL AND v_referrer_code <> '' THEN
    SELECT id INTO v_referrer_id FROM public.profiles WHERE refer_code = upper(v_referrer_code);
  END IF;

  INSERT INTO public.profiles (id, name, phone, refer_code, referred_by)
  VALUES (NEW.id, v_name, v_phone, public.generate_refer_code(), v_referrer_id);

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  IF v_referrer_id IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referred_id) VALUES (v_referrer_id, NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger for profiles
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ SET search_path = public;

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
