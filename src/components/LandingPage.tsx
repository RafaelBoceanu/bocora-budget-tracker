// src/components/LandingPage.tsx
import { useEffect } from "react";
import AdBanner from "./AdBanner";

export default function LandingPage() {
    useEffect(() => {
        // Scroll to top on mount
        window.scrollTo(0, 0);
    }, []);

    const isAndroid = /android/i.test(navigator.userAgent);
    const playStore = 'https://play.google.com/store/apps/details?id=app.bocora.twa';
    const openUrl = isAndroid
        ? `intent://bocora.vercel.app/app#Intent;scheme=https;package=app.bocora.twa;S.browser_fallback_url=${encodeURIComponent(playStore)};end`
        : '/app';

      return (
    <>
      <style>{`
        .lp-body { background: #faf8f4; min-height: 100svh; }

        /* NAV */
        .lp-nav {
          position: sticky; top: 0; z-index: 50;
          background: rgba(250,248,244,0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #ede9e0;
          padding: 0 16px; height: 56px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .lp-logo {
          font-family: 'Playfair Display', serif;
          font-size: 20px; font-weight: 700;
          color: #1a1714; text-decoration: none; letter-spacing: -0.3px;
        }
        .lp-nav-actions { display: flex; gap: 8px; align-items: center; }

        /* BUTTONS */
        .lp-btn {
          display: inline-flex; align-items: center; justify-content: center;
          font-family: 'DM Sans', sans-serif; font-weight: 500; font-size: 14px;
          border: none; cursor: pointer; border-radius: 12px;
          padding: 10px 18px; text-decoration: none;
          transition: opacity 0.15s, transform 0.1s, background 0.15s;
        }
        .lp-btn:active { transform: scale(0.96); }
        .lp-btn-primary { background: #2d2a26; color: #fff; }
        .lp-btn-primary:hover { background: #1a1714; }
        .lp-btn-ghost { background: transparent; color: #6b6460; padding: 8px 14px; }
        .lp-btn-ghost:hover { background: #f0ede7; color: #2d2a26; }
        .lp-btn-lg { padding: 14px 28px; font-size: 16px; border-radius: 14px; }
        .lp-btn-full { width: 100%; max-width: 320px; }

        /* HERO */
        .lp-hero {
          max-width: 480px; margin: 0 auto;
          padding: 48px 16px 32px; text-align: center;
        }
        .lp-eyebrow {
          display: inline-flex; align-items: center; gap: 6px;
          background: #e8f7f0; color: #1a7a4a;
          border-radius: 99px; padding: 5px 14px;
          font-size: 12px; font-weight: 600; letter-spacing: 0.3px;
          margin-bottom: 20px;
          animation: lpSlideUp 0.4s ease both;
        }
        .lp-h1 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2.2rem, 8vw, 3rem);
          font-weight: 700; line-height: 1.1;
          letter-spacing: -0.03em; color: #1a1714;
          margin-bottom: 16px;
          animation: lpSlideUp 0.4s 0.05s ease both;
        }
        .lp-h1 em { font-style: italic; color: #c4a87a; }
        .lp-sub {
          font-size: 15px; color: #6b6460; line-height: 1.65;
          margin-bottom: 32px; font-weight: 400;
          animation: lpSlideUp 0.4s 0.1s ease both;
        }
        .lp-actions {
          display: flex; flex-direction: column; gap: 10px; align-items: center;
          animation: lpSlideUp 0.4s 0.15s ease both;
        }

        /* STATS */
        .lp-stats {
          max-width: 480px; margin: 32px auto 0; padding: 0 16px;
          display: flex;
          background: #fff; border: 1px solid #ede9e0;
          border-radius: 16px; overflow: hidden;
          animation: lpSlideUp 0.4s 0.2s ease both;
        }
        .lp-stat {
          flex: 1; padding: 16px 8px; text-align: center;
          border-right: 1px solid #ede9e0;
        }
        .lp-stat:last-child { border-right: none; }
        .lp-stat-num {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem; font-weight: 700; color: #1a1714; line-height: 1;
        }
        .lp-stat-label {
          font-size: 11px; font-weight: 600; color: #9a9088;
          text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px;
        }

        /* SECTION */
        .lp-section { max-width: 480px; margin: 0 auto; padding: 40px 16px; }
        .lp-section-label {
          font-size: 11px; font-weight: 700; letter-spacing: 0.8px;
          text-transform: uppercase; color: #9a9088; margin-bottom: 8px;
        }
        .lp-section-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(1.5rem, 5vw, 2rem);
          font-weight: 700; line-height: 1.15;
          letter-spacing: -0.02em; color: #1a1714; margin-bottom: 24px;
        }

        /* FEATURE CARDS */
        .lp-features { display: flex; flex-direction: column; gap: 12px; }
        .lp-card {
          background: #fff; border: 1px solid #ede9e0;
          border-radius: 16px; padding: 18px 16px;
          display: flex; gap: 14px; align-items: flex-start;
          transition: box-shadow 0.2s;
        }
        .lp-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.07); }
        .lp-card-icon {
          width: 44px; height: 44px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; flex-shrink: 0;
          background: #faf8f4; border: 1px solid #ede9e0;
        }
        .lp-card-title {
          font-family: 'Playfair Display', serif;
          font-size: 16px; font-weight: 600; color: #1a1714; margin-bottom: 4px;
        }
        .lp-card-desc { font-size: 13px; color: #6b6460; line-height: 1.6; }

        /* HOW IT WORKS */
        .lp-how { background: #1a1714; padding: 40px 0; }
        .lp-how .lp-section-label { color: rgba(255,255,255,0.4); }
        .lp-how .lp-section-title { color: #fff; }
        .lp-steps { display: flex; flex-direction: column; }
        .lp-step {
          display: flex; gap: 16px; padding: 16px 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .lp-step:last-child { border-bottom: none; }
        .lp-step-num {
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Playfair Display', serif; font-size: 1rem; font-weight: 700;
          color: #c4a87a; flex-shrink: 0;
        }
        .lp-step-title {
          font-family: 'Playfair Display', serif; font-size: 15px;
          font-weight: 600; color: #fff; margin-bottom: 4px;
        }
        .lp-step-desc { font-size: 13px; color: rgba(255,255,255,0.45); line-height: 1.6; }

        /* FAQ */
        .lp-faq { display: flex; flex-direction: column; }
        .lp-faq-item { border-bottom: 1px solid #ede9e0; }
        .lp-faq-item:first-child { border-top: 1px solid #ede9e0; }
        .lp-faq-q {
          font-family: 'Playfair Display', serif; font-size: 15px;
          font-weight: 600; color: #1a1714; cursor: pointer;
          display: flex; justify-content: space-between; align-items: center;
          gap: 16px; padding: 18px 0; user-select: none;
          background: none; border: none; width: 100%; text-align: left;
        }
        .lp-faq-q::after {
          content: '+'; font-size: 1.3rem; font-weight: 300;
          color: #9a9088; flex-shrink: 0; transition: transform 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .lp-faq-item.open .lp-faq-q::after { transform: rotate(45deg); }
        .lp-faq-a {
          font-size: 13px; color: #6b6460; line-height: 1.7;
          max-height: 0; overflow: hidden;
          transition: max-height 0.3s ease, padding-bottom 0.3s ease;
        }
        .lp-faq-item.open .lp-faq-a { max-height: 300px; padding-bottom: 18px; }

        /* CTA */
        .lp-cta { background: #2d2a26; padding: 48px 16px; text-align: center; }
        .lp-cta-inner { max-width: 480px; margin: 0 auto; }
        .lp-cta h2 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(1.6rem, 5vw, 2.2rem); font-weight: 700;
          color: #fff; margin-bottom: 12px; letter-spacing: -0.02em;
        }
        .lp-cta p { font-size: 14px; color: rgba(255,255,255,0.5); margin-bottom: 28px; }
        .lp-cta .lp-btn-primary { background: #fff; color: #1a1714; font-weight: 600; }
        .lp-cta .lp-btn-primary:hover { background: #faf8f4; }

        /* FOOTER */
        .lp-footer {
          background: #1a1714; border-top: 1px solid rgba(255,255,255,0.06);
          padding: 24px 16px; text-align: center;
          font-size: 12px; color: rgba(255,255,255,0.3);
        }
        .lp-footer a {
          color: rgba(255,255,255,0.45); text-decoration: none;
          margin: 0 10px; transition: color 0.15s;
        }
        .lp-footer a:hover { color: #fff; }
        .lp-footer-links { margin-bottom: 10px; }

        /* AD */
        .lp-ad { max-width: 480px; margin: 0 auto; padding: 0 16px 40px; }

        @keyframes lpSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="lp-body">
        {/* NAV */}
        <nav className="lp-nav">
          <a href="/" className="lp-logo">Bocora</a>
          <div className="lp-nav-actions">
            <a href={playStore} target="_blank" rel="noreferrer" className="lp-btn lp-btn-ghost">Android App</a>
            <a href={openUrl} className="lp-btn lp-btn-primary">Open App</a>
          </div>
        </nav>

        {/* HERO */}
        <div className="lp-hero">
          <div className="lp-eyebrow">✈ Travel Budget Tracker</div>
          <h1 className="lp-h1">Track every trip,<br /><em>every currency</em></h1>
          <p className="lp-sub">
            Bocora keeps your travel budget under control — log expenses in any currency,
            see real-time conversions, and know exactly how much you have left each day.
          </p>
          <div className="lp-actions">
            <a href={openUrl} className="lp-btn lp-btn-primary lp-btn-lg lp-btn-full">Start Tracking Free</a>
            <a href={playStore} target="_blank" rel="noreferrer" className="lp-btn lp-btn-ghost lp-btn-lg lp-btn-full">Get Android App</a>
          </div>
        </div>

        {/* STATS */}
        <div className="lp-stats">
          <div className="lp-stat"><div className="lp-stat-num">150+</div><div className="lp-stat-label">Currencies</div></div>
          <div className="lp-stat"><div className="lp-stat-num">Free</div><div className="lp-stat-label">Always</div></div>
          <div className="lp-stat"><div className="lp-stat-num">Offline</div><div className="lp-stat-label">Ready</div></div>
          <div className="lp-stat"><div className="lp-stat-num">0</div><div className="lp-stat-label">Sign-ups</div></div>
        </div>

        {/* FEATURES */}
        <div className="lp-section">
          <div className="lp-section-label">Features</div>
          <h2 className="lp-section-title">Everything you need, nothing you don't</h2>
          <div className="lp-features">
            {[
              { icon: '🗺️', title: 'Multiple Trips', desc: 'Create a separate trip for each destination. Budgets, expenses, and currencies stay completely independent.' },
              { icon: '💱', title: 'Live Currency Conversion', desc: 'Log expenses in the local currency. Bocora converts everything to your home currency automatically using live rates.' },
              { icon: '📊', title: 'Spending Analytics', desc: 'See where your money goes with charts broken down by category, country, and day.' },
              { icon: '⚡', title: 'Budget Pace Tracking', desc: 'Know if you\'re on track. Bocora shows your daily spend rate versus budget remaining per day.' },
              { icon: '✈️', title: 'Works Offline', desc: 'No Wi-Fi? No problem. Log expenses anywhere and Bocora syncs rates when you\'re back online.' },
              { icon: '🔒', title: 'Private by Default', desc: 'All your data stays on your device. No account, no cloud, no tracking.' },
            ].map(f => (
              <div key={f.title} className="lp-card">
                <div className="lp-card-icon">{f.icon}</div>
                <div>
                  <div className="lp-card-title">{f.title}</div>
                  <p className="lp-card-desc">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AD */}
        <div className="lp-ad">
          <AdBanner adSlot="7035461067" />
        </div>

        {/* HOW IT WORKS */}
        <div className="lp-how">
          <div className="lp-section">
            <div className="lp-section-label">How It Works</div>
            <h2 className="lp-section-title">Up and running in under a minute</h2>
            <div className="lp-steps">
              {[
                { n: '1', title: 'Create a Trip', desc: 'Name your trip, set a total budget, and pick your home currency. Takes 30 seconds.' },
                { n: '2', title: 'Log Expenses As You Go', desc: 'Add expenses in any local currency with a category — food, transport, accommodation, and more.' },
                { n: '3', title: 'Watch Your Dashboard', desc: 'Your budget updates in real time. Charts, breakdowns, and pace tracking keep you informed.' },
                { n: '4', title: 'Travel Without Surprises', desc: 'Know your daily allowance and stick to it. Come home without the post-trip financial shock.' },
              ].map(s => (
                <div key={s.n} className="lp-step">
                  <div className="lp-step-num">{s.n}</div>
                  <div>
                    <div className="lp-step-title">{s.title}</div>
                    <p className="lp-step-desc">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="lp-section">
          <div className="lp-section-label">FAQ</div>
          <h2 className="lp-section-title">Common questions</h2>
          <div className="lp-faq">
            {[
              { q: 'Is Bocora free?', a: 'Yes, completely free. No subscriptions, no premium tiers, no paywalled features — ever.' },
              { q: 'Do I need to create an account?', a: 'No account needed. Bocora stores everything locally on your device. Nothing is sent to external servers.' },
              { q: 'Which currencies are supported?', a: 'Over 150 currencies with live conversion rates. When offline, Bocora uses the most recently cached rates.' },
              { q: 'Does it work on iPhone?', a: 'Yes. The web app works on any device including iPhone. Open it in Safari and add it to your home screen for a native feel.' },
              { q: 'Will I lose my data if I clear my browser?', a: 'Since data is stored locally, clearing browser storage will remove your trips. Note down important totals before doing so.' },
              { q: 'Can I track multiple currencies in one trip?', a: 'Yes. Each expense can be in a different currency. Bocora converts all of them to your home currency for a unified total.' },
            ].map(item => (
              <div key={item.q} className="lp-faq-item">
                <button className="lp-faq-q" onClick={e => {
                  const el = (e.currentTarget as HTMLElement).closest('.lp-faq-item')!;
                  const isOpen = el.classList.contains('open');
                  document.querySelectorAll('.lp-faq-item').forEach(i => i.classList.remove('open'));
                  if (!isOpen) el.classList.add('open');
                }}>{item.q}</button>
                <div className="lp-faq-a">{item.a}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="lp-cta">
          <div className="lp-cta-inner">
            <h2>Ready to travel smarter?</h2>
            <p>Free, no sign-up, works on any device.</p>
            <a href={openUrl} className="lp-btn lp-btn-primary lp-btn-lg">Open Bocora Free</a>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="lp-footer">
          <div className="lp-footer-links">
            <a href="/app">Web App</a>
            <a href={playStore} target="_blank" rel="noreferrer">Google Play</a>
            <a href="mailto:support@bocora.app">Contact</a>
          </div>
          <div>© 2025 Bocora. Built for travellers.</div>
        </footer>
      </div>
    </>
  );
}