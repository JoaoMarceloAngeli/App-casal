-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  likes TEXT,
  preferences TEXT,
  important_info TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Messages (recados / chat)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read messages" ON public.messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users send own messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users delete own messages" ON public.messages FOR DELETE TO authenticated USING (auth.uid() = sender_id);

-- Photos (couple photos and letters share schema, separated by 'kind')
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('photo','letter')),
  storage_path TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read photos" ON public.photos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users upload photos" ON public.photos FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploader_id);
CREATE POLICY "Users delete own photos" ON public.photos FOR DELETE TO authenticated USING (auth.uid() = uploader_id);

-- Places to visit
CREATE TABLE public.places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'quero_ir' CHECK (status IN ('quero_ir','ja_fomos')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read places" ON public.places FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert places" ON public.places FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Auth update places" ON public.places FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete places" ON public.places FOR DELETE TO authenticated USING (true);
CREATE TRIGGER places_updated_at BEFORE UPDATE ON public.places FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Important dates
CREATE TABLE public.important_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  recurring BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.important_dates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read dates" ON public.important_dates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert dates" ON public.important_dates FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Auth update dates" ON public.important_dates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete dates" ON public.important_dates FOR DELETE TO authenticated USING (true);

-- Movies
CREATE TABLE public.movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'quero_ver' CHECK (status IN ('quero_ver','ja_vimos')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read movies" ON public.movies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert movies" ON public.movies FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Auth update movies" ON public.movies FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete movies" ON public.movies FOR DELETE TO authenticated USING (true);
CREATE TRIGGER movies_updated_at BEFORE UPDATE ON public.movies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Suggestions
CREATE TABLE public.suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read suggestions" ON public.suggestions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert suggestions" ON public.suggestions FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Auth update suggestions" ON public.suggestions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete suggestions" ON public.suggestions FOR DELETE TO authenticated USING (true);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('couple-photos', 'couple-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

CREATE POLICY "Public read couple-photos" ON storage.objects FOR SELECT USING (bucket_id = 'couple-photos');
CREATE POLICY "Auth upload couple-photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'couple-photos');
CREATE POLICY "Auth delete own couple-photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'couple-photos' AND owner = auth.uid());

CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Auth upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Auth update own avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND owner = auth.uid());