/**
 * Homepage - Nutri
 */

import HeaderWrapper from '@/app/components/navigation/HeaderWrapper';
import HeroSearch from '@/app/components/home/HeroSearch';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="home-page">
      <HeaderWrapper />
      <HeroSearch isAuthed={!!user} />
    </div>
  );
}
