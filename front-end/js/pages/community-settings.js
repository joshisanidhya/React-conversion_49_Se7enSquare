/**
 * Gameunity - Community Settings
 * Functional localStorage-backed settings for basic info, members, channels,
 * and simple roles.
 */

const COMMUNITY_KEYS = ["communities", "nexus_communities"];
const DEFAULT_COMMUNITY_ID = "1";

let communities = [];
let currentCommunity = null;
let savedSnapshot = null;

const defaultCommunities = [
  {
    id: "1",
    name: "FPS Arena",
    description: "Competitive FPS players and tournaments",
    icon: "G",
    category: "Gaming",
    tags: ["announcements", "general"],
    channels: [
      { id: 1, name: "announcements", type: "Announcement" },
      { id: 2, name: "general", type: "Text" },
    ],
    members: [
      { id: 101, name: "Rahul Kumar", handle: "@rahulk", role: "Owner", initials: "RK", status: "Online" },
      { id: 102, name: "Arjun Kumar", handle: "@arjunk", role: "Member", initials: "AK", status: "Online" },
    ],
    roles: ["Owner", "Manager", "Moderator", "Member"],
  },
];

function readJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function getCommunityId() {
  return new URLSearchParams(window.location.search).get("id") || DEFAULT_COMMUNITY_ID;
}

function normalizeId(value) {
  return String(value ?? "");
}

function normalizeCommunity(community) {
  const tags = Array.isArray(community.tags) ? community.tags : [];
  const channels = Array.isArray(community.channels) && community.channels.length
    ? community.channels
    : tags.map((tag, index) => ({ id: index + 1, name: tag, type: "Text" }));

  return {
    ...community,
    id: normalizeId(community.id),
    name: community.name || "Untitled Community",
    description: community.description || "",
    icon: community.icon || "G",
    tags,
    channels,
    members: Array.isArray(community.members) ? community.members : [],
    roles: Array.isArray(community.roles) && community.roles.length
      ? community.roles
      : ["Owner", "Manager", "Moderator", "Member"],
  };
}

function loadCommunitiesFromStorage() {
  for (const key of COMMUNITY_KEYS) {
    const stored = readJSON(key, null);
    if (Array.isArray(stored) && stored.length) {
      return stored.map(normalizeCommunity);
    }
  }

  const seeded = defaultCommunities.map(normalizeCommunity);
  persistCommunities(seeded);
  return seeded;
}

function persistCommunities(nextCommunities = communities) {
  const payload = nextCommunities.map((community) => ({
    ...community,
    tags: (community.channels || []).map((channel) => channel.name),
  }));

  COMMUNITY_KEYS.forEach((key) => {
    localStorage.setItem(key, JSON.stringify(payload));
  });
}

function setDirty(isDirty = true) {
  document.getElementById("settingsActions")?.classList.toggle("show", isDirty);
}

function renderBanner() {
  const preview = document.getElementById("bannerPreview");
  if (!preview) return;

  const banner = currentCommunity?.bannerImage || currentCommunity?.banner || "";
  if (!banner) {
    preview.style.backgroundImage = "none";
    preview.textContent = "No Banner Uploaded";
    return;
  }

  preview.style.backgroundImage = `url(${banner})`;
  preview.textContent = "";
}

function renderHeader() {
  const name = currentCommunity?.name || "Community";
  const mark = document.querySelector(".community-mark");
  const title = document.getElementById("topBarCommunityName");

  if (title) title.textContent = name;
  if (mark) mark.textContent = name.trim().charAt(0).toUpperCase() || "G";
}

async function renderMembers() {
  const list = document.getElementById("settingsMemberList");
  if (!list) return;

  list.innerHTML = `<div class="empty-state">Loading members…</div>`;

  let members = [];
  try {
    const [memberships, users] = await Promise.all([
      window.API.memberships.getAll({ communityId: currentCommunity.id }),
      window.API.users.getAll(),
    ]);
    const usersById = new Map(users.map((u) => [String(u.id), u]));
    members = memberships.map((m) => {
      const user = usersById.get(String(m.userId));
      const isOwner = user && String(user.id) === String(currentCommunity.ownerId);
      return {
        userId: m.userId,
        name: user ? (user.username || user.email) : `User #${m.userId}`,
        handle: user ? `@${user.username}` : "",
        role: isOwner ? "Owner" : "Member",
        initials: initialsFromName(user?.username || `U${m.userId}`),
        status: "Active",
      };
    });
  } catch (err) {
    console.warn("[CommunitySettings] Could not load real members, showing local fallback:", err.message);
    members = currentCommunity.members.length ? currentCommunity.members : [];
  }

  if (!members.length) {
    list.innerHTML = `<div class="empty-state">No members yet.</div>`;
    return;
  }

  list.innerHTML = members.map((member) => `
    <div class="member-item">
      <div class="member-avatar">${member.initials || member.avatar || initialsFromName(member.name)}</div>
      <div class="member-info">
        <div class="member-name">${member.name || "Member"} <span class="muted-inline">${member.handle || ""}</span></div>
        <div class="member-date">${member.role || "Member"} &middot; ${member.status || "Active"}</div>
      </div>
      ${member.userId ? `<button class="btn-sm danger" onclick="reportMember(${member.userId})">Report</button>` : ""}
    </div>
  `).join("");
}

window.reportMember = function (userId) {
  window.location.href = `report.html?targetType=user&targetId=${encodeURIComponent(userId)}`;
};

function renderChannels() {
  const list = document.getElementById("settingsChannelList");
  if (!list) return;

  if (!currentCommunity.channels.length) {
    list.innerHTML = `<div class="empty-state">No channels yet. Create the first channel for this community.</div>`;
    return;
  }

  list.innerHTML = currentCommunity.channels.map((channel) => `
    <div class="channel-item">
      <div class="channel-icon">${channel.type === "Voice" ? "VC" : "#"}</div>
      <div class="channel-info">
        <div class="channel-name">${channel.name}</div>
        <div class="channel-type">${channel.type || "Text"} Channel</div>
      </div>
      <div class="channel-actions">
        <button class="btn-sm danger" onclick="deleteChannel('${channel.id}')">Delete</button>
      </div>
    </div>
  `).join("");
}


function renderCommunity() {
  document.getElementById("communityName").value = currentCommunity.name;
  document.getElementById("communityDesc").value = currentCommunity.description;
  const rulesEl = document.getElementById("communityRules");
  if (rulesEl) rulesEl.value = (currentCommunity.rules || []).join("\n");
  renderHeader();
  renderBanner();
  renderMembers();
  renderChannels();
  setDirty(false);
}

// Was localStorage-first (only ever reading a stale/fake seeded cache), so a
// real community created via the backend never actually showed its real
// data here — settings looked "limited", and Insights had no real ownerId
// to look up a plan with. The backend record is now the source of truth;
// localStorage is only a fallback when it's unreachable.
async function loadCommunity() {
  const id = getCommunityId();
  communities = loadCommunitiesFromStorage();

  let backendCommunity = null;
  if (window.API && window.API.communities) {
    try {
      backendCommunity = await window.API.communities.getOne(id);
    } catch (err) {
      console.warn("[CommunitySettings] Could not load community from backend, using local cache:", err.message);
    }
  }

  if (backendCommunity) {
    currentCommunity = normalizeCommunity(backendCommunity);
  } else {
    currentCommunity = communities.find((community) => normalizeId(community.id) === normalizeId(id));

    if (!currentCommunity) {
      currentCommunity = normalizeCommunity({
        ...defaultCommunities[0],
        id,
        name: "New Community",
        description: "Describe what this community is about.",
      });
      communities.push(currentCommunity);
      persistCommunities();
    }
  }

  savedSnapshot = JSON.parse(JSON.stringify(currentCommunity));
  renderCommunity();
}

function saveCommunitySettings() {
  if (!currentCommunity) return;

  const nameInput = document.getElementById("communityName");
  const descInput = document.getElementById("communityDesc");
  const error = document.getElementById("basicSettingsError");
  const name = nameInput.value.trim();
  const description = descInput.value.trim();

  if (!name || !description) {
    if (error) {
      error.textContent = "Community name and description are required.";
      error.style.display = "block";
    }
    return;
  }

  if (error) {
    error.textContent = "";
    error.style.display = "none";
  }

  currentCommunity.name = name;
  currentCommunity.description = description;

  const rulesEl = document.getElementById("communityRules");
  currentCommunity.rules = rulesEl
    ? rulesEl.value.split("\n").map((line) => line.trim()).filter(Boolean)
    : currentCommunity.rules;

  communities = communities.map((community) =>
    normalizeId(community.id) === normalizeId(currentCommunity.id) ? currentCommunity : community
  );

  persistCommunities();

  // Sync to backend — awaited (not fire-and-forget) so a real rejection
  // (e.g. the channel-count plan limit) surfaces as an error instead of the
  // UI claiming success while the backend silently kept the old data.
  if (window.API && window.API.communities && window.API.communities.update) {
    window.API.communities.update(currentCommunity.id, {
        name: currentCommunity.name,
        description: currentCommunity.description,
        channels: currentCommunity.channels,
        rules: currentCommunity.rules,
        banner: currentCommunity.banner,
        bannerImage: currentCommunity.bannerImage
    }).then(() => {
        savedSnapshot = JSON.parse(JSON.stringify(currentCommunity));
        renderHeader();
        setDirty(false);
        toast("Community updated successfully");
    }).catch(err => {
        console.warn('Failed to sync settings to API:', err);
        toast("⚠️ Could not save: " + err.message);
    });
    return;
  }

  savedSnapshot = JSON.parse(JSON.stringify(currentCommunity));
  renderHeader();
  setDirty(false);
  toast("Community updated successfully");
}

async function uploadBanner(event) {
  const file = event.target.files[0];
  if (!file || !currentCommunity) return;

  if (!window.API || !window.API.uploads) {
    toast("Upload service unavailable");
    return;
  }

  try {
    const result = await window.API.uploads.upload(file);
    currentCommunity.bannerImage = result.absoluteUrl;
    currentCommunity.banner = result.absoluteUrl;
    renderBanner();
    setDirty(true);
  } catch (err) {
    console.warn('Banner upload failed:', err);
    toast("Failed to upload banner. Please try again.");
  } finally {
    event.target.value = '';
  }
}

function initialsFromName(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "U";
}

function activateSettingsTab(targetId, navEl) {
  document.querySelectorAll(".section").forEach((section) => {
    section.style.display = "none";
    section.classList.remove("active");
  });

  document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));

  const targetSection = document.getElementById(targetId);
  if (targetSection) {
    targetSection.style.display = "block";
    targetSection.classList.add("active");
  }

  if (navEl) navEl.classList.add("active");
}

window.switchSettingsTab = function (tabId, navEl) {
  const tabButton = navEl || document.querySelector(`[data-settings-tab="${tabId}"]`);
  activateSettingsTab(`settings-${tabId}`, tabButton);
  if (tabId === 'insights') loadInsightsTab();
};

// Community Boost is an Ultra Pro perk (doc §8/§17) — gated on the community
// OWNER's subscription plan, not the viewing user's.
async function loadInsightsTab() {
  if (!currentCommunity) return;

  const memberEl = document.getElementById('insMemberCount');
  const channelEl = document.getElementById('insChannelCount');
  const onlineEl = document.getElementById('insOnlineCount');
  if (memberEl) memberEl.textContent = currentCommunity.memberCount ?? (currentCommunity.members?.length || 0);
  if (channelEl) channelEl.textContent = (currentCommunity.channels || []).length;
  if (onlineEl) onlineEl.textContent = currentCommunity.onlineCount ?? 0;

  const statusEl = document.getElementById('insBoostStatus');
  const featuresEl = document.getElementById('insBoostFeatures');
  if (!statusEl || !window.API) return;

  try {
    const sub = await window.API.subscriptions.status(currentCommunity.ownerId);
    if (sub.plan === 'ultra_pro') {
      statusEl.textContent = "🚀 Boosted — this community's owner is on Ultra Pro.";
      featuresEl.innerHTML = ['Animated community icon', 'Priority discovery placement', 'Custom invite link', 'Event countdown widget', 'Larger upload limit']
        .map(f => `<div>✓ ${f}</div>`).join('');
    } else {
      statusEl.textContent = 'Not boosted — the community owner is on the Free or Plus plan.';
      featuresEl.innerHTML = `<div>Upgrading the owner's account to Ultra Pro unlocks: animated icon, priority discovery, custom invite link, event countdown widget, larger uploads.</div>`;
    }
  } catch (err) {
    console.error('[CommunitySettings] Could not load boost status:', err.message);
    statusEl.textContent = '⚠️ Could not reach the backend.';
  }
}

window.goToCommunity = function () {
  const id = getCommunityId();
  window.location.href = `community-page.html?id=${encodeURIComponent(id)}`;
};

window.showModal = function (id) {
  document.getElementById(id)?.classList.add("show");
};

window.closeModal = function (id) {
  document.getElementById(id)?.classList.remove("show");
};

window.toast = function (msg) {
  const toastEl = document.getElementById("toast");
  const msgEl = document.getElementById("toastMsg");

  if (!toastEl || !msgEl) {
    alert(msg);
    return;
  }

  msgEl.textContent = msg;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 2400);
};

window.submitCreateChannel = async function () {
  const nameInput = document.getElementById("chNameInput");
  const typeInput = document.getElementById("chTypeInput");
  const rawName = nameInput?.value.trim();

  if (!rawName) {
    toast("Channel name cannot be empty");
    return;
  }

  const normalizedName = rawName.toLowerCase().replace(/\s+/g, "-");
  const exists = currentCommunity.channels.some((channel) => channel.name === normalizedName);
  if (exists) {
    toast("A channel with that name already exists");
    return;
  }

  const nextChannels = [
    ...currentCommunity.channels,
    { id: String(Date.now()), name: normalizedName, type: typeInput?.value || "Text" },
  ];

  // Save immediately — the modal says "added", so it should actually be
  // persisted right away rather than waiting for a separate "Save Changes"
  // click the user may not realize is still needed.
  if (window.API?.communities && currentCommunity.id) {
    try {
      await window.API.communities.update(currentCommunity.id, { channels: nextChannels });
    } catch (err) {
      toast("⚠️ Could not create channel: " + err.message);
      return;
    }
  }

  currentCommunity.channels = nextChannels;
  renderChannels();
  closeModal("modalBg");
  if (nameInput) nameInput.value = "";
  toast(`✅ Channel #${normalizedName} created`);
};

window.deleteChannel = async function (channelId) {
  const nextChannels = currentCommunity.channels.filter(
    (channel) => normalizeId(channel.id) !== normalizeId(channelId)
  );

  if (window.API?.communities && currentCommunity.id) {
    try {
      await window.API.communities.update(currentCommunity.id, { channels: nextChannels });
    } catch (err) {
      toast("⚠️ Could not delete channel: " + err.message);
      return;
    }
  }

  currentCommunity.channels = nextChannels;
  renderChannels();
  toast("Channel deleted");
};

window.discardSettings = function () {
  if (!savedSnapshot) return;
  currentCommunity = JSON.parse(JSON.stringify(savedSnapshot));
  communities = communities.map((community) =>
    normalizeId(community.id) === normalizeId(currentCommunity.id) ? currentCommunity : community
  );
  renderCommunity();
  toast("Unsaved changes discarded");
};

window.saveSettings = saveCommunitySettings;
window.saveCommunitySettings = saveCommunitySettings;
window.uploadBanner = uploadBanner;
window.handleBannerUpload = uploadBanner;
window.loadCommunity = loadCommunity;

document.addEventListener("DOMContentLoaded", async () => {
  if (typeof renderUserUI === "function") renderUserUI();
  await loadCommunity(); // must finish before the ownership check below reads currentCommunity

  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : {};
  const ownedIds = JSON.parse(localStorage.getItem('nexus_owned_community_ids') || '[]');
  const cId = currentCommunity ? String(currentCommunity.id) : null;
  
  const isOwner = cId && (
      ownedIds.includes(cId) || 
      (user?.id && String(currentCommunity?.ownerId) === String(user.id)) ||
      user?.role === 'admin'
  );

  // If not the creator of this specific community, enforce global role limits
  if (!isOwner && typeof requireRole === "function") {
      if (!requireRole(["community_manager", "admin"])) return;
  }

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => activateSettingsTab(tab.dataset.target, tab));
  });

  const activeTab = document.querySelector(".tab.active") || document.querySelector(".tab");
  if (activeTab) activateSettingsTab(activeTab.dataset.target, activeTab);

  document.querySelectorAll("#view-settings input, #view-settings textarea, #view-settings select").forEach((el) => {
    el.addEventListener("input", () => setDirty(true));
    el.addEventListener("change", () => setDirty(true));
  });
});
