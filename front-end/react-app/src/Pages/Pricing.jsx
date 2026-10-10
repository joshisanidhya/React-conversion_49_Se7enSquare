import React, { useState } from 'react';
import Navbar from '../Components/Navbar';
import Footer from '../Components/Footer';
import Button from '../Components/Button';
import '../styles/pricing.css';

/**
 * Pricing & Subscription Component
 * Converted from pricing.html, rendering subscription plans via data mapping,
 * managing current plan selection in React state, and providing plan switching feedback.
 */
const API_BASE = 'http://localhost:3000/api';

function getCurrentUser() {
  try {
    const raw = JSON.parse(localStorage.getItem('nexus_user') || localStorage.getItem('currentUser') || '{}');
    return {
      id: raw.id || 1,
      role: raw.role || 'user',
    };
  } catch {
    return { id: 1, role: 'user' };
  }
}

export default function Pricing() {
  const PLANS = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      features: [
        'Up to 4 communities',
        'Up to 4 channels per community',
        '1 moderator',
        'Limited uploads',
        'Basic profile',
      ],
    },
    {
      id: 'plus',
      name: 'Plus',
      price: 99,
      features: [
        '10 communities',
        '20 channels per community',
        'Up to 5 moderators',
        'Premium badge',
        'Username color',
        'Larger uploads',
      ],
    },
    {
      id: 'ultra_pro',
      name: 'Ultra Pro',
      price: 299,
      featured: true,
      features: [
        'Unlimited communities',
        'Unlimited channels',
        'Unlimited moderators',
        'Unlimited members',
        'Animated profile frame',
        'HD Voice',
        'Community Insights Dashboard',
        'Community Boost features',
      ],
    },
  ];

  const PLAN_RANK = { free: 0, plus: 1, ultra_pro: 2 };

  // Current active plan in React state
  const [currentPlan, setCurrentPlan] = useState('free');

  // Toast notification state
  const [toast, setToast] = useState({ show: false, icon: '✅', msg: '' });

  const showToast = (icon, msg) => {
    setToast({ show: true, icon, msg });
    setTimeout(() => {
      setToast({ show: false, icon: '✅', msg: '' });
    }, 2800);
  };

  useEffect(() => {
    const user = getCurrentUser();
    fetch(`${API_BASE}/subscriptions/status?userId=${user.id}`, {
      headers: { 'x-role': user.role },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.plan) {
          setCurrentPlan(data.plan);
        }
      })
      .catch(() => {});
  }, []);

  const handlePlanChange = async (planId) => {
    const targetPlan = PLANS.find((p) => p.id === planId);
    if (!targetPlan) return;

    const isDowngrade = PLAN_RANK[planId] < PLAN_RANK[currentPlan];

    if (isDowngrade) {
      const confirmed = window.confirm(
        `Downgrade to ${targetPlan.name}? You'll lose access to paid features beyond the ${targetPlan.name} tier limits.`
      );
      if (!confirmed) return;
    }

    const user = getCurrentUser();
    try {
      const res = await fetch(`${API_BASE}/subscriptions/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-role': user.role,
        },
        body: JSON.stringify({ userId: Number(user.id), plan: planId }),
      });
      if (res.ok) {
        setCurrentPlan(planId);
        showToast('✅', `Now on the ${targetPlan.name} plan`);
        return;
      }
    } catch {}

    setCurrentPlan(planId);
    showToast('✅', `Now on the ${targetPlan.name} plan`);
  };

  const handleCancelSubscription = async () => {
    if (currentPlan === 'free') {
      showToast('ℹ️', 'You are already on the Free plan.');
      return;
    }
    const user = getCurrentUser();
    try {
      await fetch(`${API_BASE}/subscriptions/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-role': user.role,
        },
        body: JSON.stringify({ userId: Number(user.id) }),
      });
    } catch {}
    setCurrentPlan('free');
    showToast('✅', 'Subscription cancelled — Reverted to the Free plan');
  };

  return (
    <div className="pricing-page-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Reusable Navbar */}
      <Navbar />

      <main style={{ flex: 1, maxWidth: '1120px', margin: '0 auto', padding: '120px 24px 60px', width: '100%' }}>
        {/* Header Title Bar */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            borderBottom: '1px solid var(--border, rgba(255,255,255,0.06))',
            paddingBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '24px' }}>💎</div>
            <h1
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: '24px',
                fontWeight: 800,
                color: 'var(--text-1, #fff)',
                margin: 0,
              }}
            >
              Pricing &amp; Subscription
            </h1>
            <span
              style={{
                background: 'rgba(91,110,245,0.15)',
                color: 'var(--ac3, #8B9CF8)',
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              PLANS
            </span>
          </div>
        </header>

        {/* Pricing Subtitle Intro */}
        <p className="pricing-intro">
          Free gets you started. Plus and Ultra Pro unlock bigger communities, more moderators, and premium extras.
          Upgrades are simulated for this build — no real payment is taken.
        </p>

        {/* Dynamic Plan Grid */}
        <div className="plan-grid" id="planGrid">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            const isDowngrade = PLAN_RANK[plan.id] < PLAN_RANK[currentPlan];

            return (
              <div
                key={plan.id}
                className={`plan-card ${isCurrent ? 'current' : ''} ${plan.featured ? 'featured' : ''}`}
              >
                {isCurrent && <div className="plan-badge-current">CURRENT</div>}

                <div className="plan-name">{plan.name}</div>

                <div className="plan-price">
                  {plan.price === 0 ? (
                    'Free'
                  ) : (
                    <>
                      ₹{plan.price}
                      <span>/mo</span>
                    </>
                  )}
                </div>

                <ul className="plan-features">
                  {plan.features.map((feat, idx) => (
                    <li key={idx}>{feat}</li>
                  ))}
                </ul>

                {isCurrent ? (
                  <Button className="plan-cta current" disabled>
                    Current Plan
                  </Button>
                ) : isDowngrade ? (
                  <Button className="plan-cta downgrade" onClick={() => handlePlanChange(plan.id)}>
                    Downgrade
                  </Button>
                ) : (
                  <Button className="plan-cta primary" onClick={() => handlePlanChange(plan.id)}>
                    Upgrade to {plan.name}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Cancellation Card */}
        <div
          className="card"
          style={{
            maxWidth: '520px',
            background: 'var(--bg-2, #111118)',
            border: '1px solid var(--border, rgba(255,255,255,0.06))',
            borderRadius: '16px',
            padding: '24px',
            marginTop: '32px',
          }}
        >
          <div className="card-header" style={{ marginBottom: '8px' }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '18px', margin: 0, color: 'var(--text-1, #fff)' }}>
              Need to cancel?
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-3, #888)', marginBottom: '16px' }}>
            Cancelling reverts you to the Free plan immediately.
          </p>
          <Button
            className="btn-ghost"
            onClick={handleCancelSubscription}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent',
              color: 'var(--text-2, #ccc)',
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Cancel current subscription
          </Button>
        </div>
      </main>

      {/* Reusable Footer */}
      <Footer />

      {/* Toast Notification */}
      <div className={`toast ${toast.show ? 'show' : ''}`} id="toast">
        <span id="toastIcon">{toast.icon}</span>
        <span id="toastMsg">{toast.msg}</span>
      </div>
    </div>
  );
}

