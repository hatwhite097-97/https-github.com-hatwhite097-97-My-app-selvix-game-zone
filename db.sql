-- Supabase SQL Schema for Selvix Game Zone

-- 0. Clean up existing tables (Optional: useful for re-running the script)
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.chats CASCADE;
DROP TABLE IF EXISTS public.games CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 1. Create Tables

-- Users Table
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    is_blocked_from_chatting BOOLEAN DEFAULT FALSE,
    points_balance NUMERIC DEFAULT 0.0,
    streak_count INTEGER DEFAULT 0,
    last_reward_claimed_date TIMESTAMP WITH TIME ZONE,
    referred_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Games Table
CREATE TABLE public.games (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    image_url TEXT,
    category TEXT,
    is_paid BOOLEAN DEFAULT FALSE,
    price NUMERIC DEFAULT 0.0,
    download_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Chats Table
CREATE TABLE public.chats (
    id SERIAL PRIMARY KEY,
    sender_username TEXT NOT NULL,
    sender_full_name TEXT NOT NULL,
    message TEXT NOT NULL,
    is_social BOOLEAN DEFAULT TRUE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Settings Table (Single row)
CREATE TABLE public.settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    is_referral_active BOOLEAN DEFAULT TRUE,
    is_withdrawal_active BOOLEAN DEFAULT TRUE,
    is_social_chat_closed BOOLEAN DEFAULT FALSE,
    is_admin_chat_closed BOOLEAN DEFAULT FALSE,
    speedpesa_api_key TEXT DEFAULT ''
);

-- Transactions Table
CREATE TABLE public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reference TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    amount NUMERIC NOT NULL,
    user_id UUID REFERENCES public.users(id),
    game_id INTEGER REFERENCES public.games(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Row Level Security (RLS)

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Policies for Users
CREATE POLICY "Users can view their own profile." ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles." ON public.users FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Users can update their own profile." ON public.users FOR UPDATE USING (auth.uid() = id);

-- Policies for Games
CREATE POLICY "Anyone can view games." ON public.games FOR SELECT USING (true);
CREATE POLICY "Only admins can modify games." ON public.games FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));

-- Policies for Chats
CREATE POLICY "Anyone can view chats." ON public.chats FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert chats." ON public.chats FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Only admins can delete chats." ON public.chats FOR DELETE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));

-- Policies for Settings
CREATE POLICY "Anyone can view settings." ON public.settings FOR SELECT USING (true);
CREATE POLICY "Only admins can update settings." ON public.settings FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));

-- Policies for Transactions
CREATE POLICY "Users can view their own transactions." ON public.transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all transactions." ON public.transactions FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Authenticated users can insert transactions." ON public.transactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Only admins can update transactions." ON public.transactions FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));

-- 3. Initial Data Seed

INSERT INTO public.games (title, image_url, category, is_paid, price, download_url, description) VALUES
('WINLATOR', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600', 'PC GAME', false, 0.0, 'https://github.com/winlator/winlator/releases/download/v6.1.0/Winlator_6.1.apk', 'Winlator ni emulator bora ya Android inayokuruhusu kucheza michezo ya PC ya Windows (kama GTA V, Skyrim n.k) kwenye kifaa chako cha mkononi ikiwa na uwezo mkubwa wa graphic.'),
('TOMB RAIDER 3', 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=600', 'EMULATOR GAME', true, 2500.0, 'https://example.com/games/tomb_raider3_emu.zip', 'Cheza mchezo wa asili na wa kusisimua wa Tomb Raider III kwenye emulator yako ya simu. Pambana na maadui, tatua mafumbo, na gundua siri za kale kote duniani.'),
('GTA IV', 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=600', 'PC GAME', false, 0.0, 'https://example.com/games/gta4_pc.zip', 'Grand Theft Auto IV ni mchezo wa ulimwengu wazi uliotengenezwa na Rockstar Games unaofanyika katika jiji kuu la Liberty City. Shuhudia visa vya Niko Bellic katika azma yake ya kuishi maisha bora.'),
('CALL OF DUTY: STRIKE TEAM', 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600', 'MOBILE GAME', false, 0.0, 'https://example.com/games/cod_strike_team.apk', 'Call of Duty: Strike Team inaleta uzoefu mpya kabisa wa Call of Duty vya 3D kwa vifaa vya simu za mkononi, ukiunganisha mtazamo wa kwanza wa shooter (FPS) na mtazamo wa tatu wa tactical.');

INSERT INTO public.settings (id, is_referral_active, is_withdrawal_active, is_social_chat_closed, is_admin_chat_closed, speedpesa_api_key) VALUES (1, true, true, false, false, '');
