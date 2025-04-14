# Radiant Portfolio Pulse

A modern stock portfolio management application built with React, Redux, and Supabase, featuring real-time stock data from Finnhub.

## Features

- Real-time stock data and portfolio tracking
- Watchlist management with price alerts
- Transaction history with filtering
- Portfolio analytics and performance metrics
- User settings and preferences
- Responsive design with dark/light mode support

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account
- Finnhub API key

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/radiant-portfolio-pulse.git
cd radiant-portfolio-pulse
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory with the following variables:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_FINNHUB_API_KEY=your_finnhub_api_key
```

4. Set up the Supabase database tables:

Execute the following SQL in your Supabase SQL editor:

```sql
-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.portfolio_holdings enable row level security;
alter table public.stocks enable row level security;
alter table public.transactions enable row level security;
alter table public.watchlist_items enable row level security;

-- Create RLS policies
create policy "Users can view their own profile"
  on public.profiles for select
  using ( auth.uid() = id );

create policy "Users can update their own profile"
  on public.profiles for update
  using ( auth.uid() = id );

create policy "Users can view their own portfolio holdings"
  on public.portfolio_holdings for select
  using ( auth.uid() = user_id );

create policy "Users can manage their own portfolio holdings"
  on public.portfolio_holdings for all
  using ( auth.uid() = user_id );

create policy "Users can view stocks"
  on public.stocks for select
  to authenticated
  using ( true );

create policy "Users can view their own transactions"
  on public.transactions for select
  using ( auth.uid() = user_id );

create policy "Users can manage their own transactions"
  on public.transactions for all
  using ( auth.uid() = user_id );

create policy "Users can view their own watchlist items"
  on public.watchlist_items for select
  using ( auth.uid() = user_id );

create policy "Users can manage their own watchlist items"
  on public.watchlist_items for all
  using ( auth.uid() = user_id );

-- Create functions for Finnhub API integration
create or replace function get_finnhub_api_key()
returns text as $$
begin
  return current_setting('app.finnhub_api_key');
end;
$$ language plpgsql security definer;

-- Set up database functions
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, created_at, updated_at)
  values (new.id, now(), now());
  return new;
end;
$$ language plpgsql security definer;

-- Set up trigger for new user profiles
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

5. Start the development server:
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:5173`.

## Usage

1. Sign up for an account or log in if you already have one.
2. Add stocks to your portfolio using the "Add Stock" button.
3. Set up watchlists and price alerts for stocks you're interested in.
4. Track your portfolio performance and view analytics.
5. Manage your settings and preferences.

## Development

- `npm run build` - Build the production version
- `npm run lint` - Run ESLint
- `npm run preview` - Preview the production build locally

## Technologies Used

- React 18
- Redux Toolkit
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- Finnhub API
- Chart.js
- HeadlessUI
- Hero Icons

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
