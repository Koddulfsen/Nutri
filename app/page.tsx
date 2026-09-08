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

      <section className="home-section">
        <div className="home-section-inner">
          <h2 className="home-section-title">The world&apos;s food data, unified.</h2>
          <p className="home-section-lead">
            Food composition data from 15 official sources, aggregated into a
            single Nutri database.
          </p>

          <div className="home-stats">
            <div className="home-stat">
              <span className="home-stat-value">280</span>
              <span className="home-stat-label">compounds tracked</span>
            </div>
            <div className="home-stat">
              <span className="home-stat-value">16,832</span>
              <span className="home-stat-label">reference daily values</span>
            </div>
            <div className="home-stat">
              <span className="home-stat-value">15</span>
              <span className="home-stat-label">health authorities</span>
            </div>
          </div>

          <div className="home-feature">
            <h3 className="home-feature-title">Know what you&apos;re eating.</h3>
          </div>
        </div>
      </section>
    </div>
  );
}
