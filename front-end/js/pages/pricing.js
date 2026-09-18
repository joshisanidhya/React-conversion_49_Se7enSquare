/**
 * Gameunity — Pricing & Subscription
 * User Free/Plus/Ultra Pro plans (doc §8). Upgrades are simulated — logged to
 * the payments ledger backend-side, no real gateway involved.
 */

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

let currentPlan = 'free';

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof enforcePageAccess === 'function' && !enforcePageAccess()) return;
    await loadStatus();
    render();
});

function currentUserId() {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    return user?.id;
}

async function loadStatus() {
    const userId = currentUserId();
    if (!userId) return;
    try {
        const status = await window.API.subscriptions.status(userId);
        currentPlan = status.plan || 'free';
    } catch (err) {
        console.error('[Pricing] Failed to load subscription status:', err);
        toast('⚠️ Could not reach the backend — showing Free plan by default');
    }
}

function render() {
    const grid = document.getElementById('planGrid');
    if (!grid) return;

    grid.innerHTML = PLANS.map(plan => {
        const isCurrent = plan.id === currentPlan;
        const isDowngrade = PLAN_RANK[plan.id] < PLAN_RANK[currentPlan];
        let ctaHtml;
        if (isCurrent) {
            ctaHtml = `<button class="plan-cta current" disabled>Current Plan</button>`;
        } else if (isDowngrade) {
            ctaHtml = `<button class="plan-cta downgrade" onclick="changePlan('${plan.id}')">Downgrade</button>`;
        } else {
            ctaHtml = `<button class="plan-cta primary" onclick="changePlan('${plan.id}')">Upgrade to ${esc(plan.name)}</button>`;
        }

        return `
        <div class="plan-card${isCurrent ? ' current' : ''}${plan.featured ? ' featured' : ''}">
            ${isCurrent ? '<div class="plan-badge-current">CURRENT</div>' : ''}
            <div class="plan-name">${esc(plan.name)}</div>
            <div class="plan-price">${plan.price === 0 ? 'Free' : `₹${plan.price}<span>/mo</span>`}</div>
            <ul class="plan-features">${plan.features.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
            ${ctaHtml}
        </div>`;
    }).join('');
}

window.changePlan = async function (planId) {
    const userId = currentUserId();
    if (!userId) { toast('⚠️ No signed-in user id — please log back in'); return; }

    const isDowngrade = PLAN_RANK[planId] < PLAN_RANK[currentPlan];
    if (isDowngrade) {
        const planName = PLANS.find(p => p.id === planId)?.name || planId;
        const confirmed = confirm(
            `Downgrade to ${planName}? You'll immediately lose access to your current plan's paid features (extra communities/channels/moderators already created stay, but you won't be able to add more beyond the ${planName} limits).`,
        );
        if (!confirmed) return;
    }

    try {
        await window.API.subscriptions.upgrade(userId, planId);
        currentPlan = planId;
        render();
        toast(`✅ Now on the ${PLANS.find(p => p.id === planId)?.name || planId} plan`);
    } catch (err) {
        toast('⚠️ ' + err.message);
    }
};

window.cancelSubscription = async function () {
    const userId = currentUserId();
    if (!userId) { toast('⚠️ No signed-in user id — please log back in'); return; }
    try {
        await window.API.subscriptions.cancel(userId);
        currentPlan = 'free';
        render();
        toast('✅ Reverted to the Free plan');
    } catch (err) {
        toast('⚠️ ' + err.message);
    }
};

function esc(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

let toastTimer;
function toast(msg) {
    const t    = document.getElementById('toast');
    const icon = document.getElementById('toastIcon');
    const txt  = document.getElementById('toastMsg');
    if (!t) return;
    const parts = msg.match(/^(\S+)\s(.+)$/);
    if (parts && icon && txt) { icon.textContent = parts[1]; txt.textContent = parts[2]; }
    else if (txt) { if (icon) icon.textContent = '✅'; txt.textContent = msg; }
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}
