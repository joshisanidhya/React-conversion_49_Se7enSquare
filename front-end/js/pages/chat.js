/**
 * Gameunity — Channel Chat Logic
 * Handles messaging, channel switching, sidebar toggles, search, and UI interactions.
 */

// ==========================================
// 1. DATA & STATE
// ==========================================
const CHANNEL_TOPICS = {
  general: "The main hub — say hello, share updates, ask anything 👋",
  introductions: "New here? Introduce yourself and your gaming setup!",
  "off-topic": "Non-gaming chat — memes, life, random goodness 😄",
  frontend: "HTML, CSS, JS, React, Vue, Angular and all things UI",
  Strategy: "Gaming strategy, builds, tier lists and meta discussion",
  "code-review": "Post your code — get honest, constructive feedback",
  Streaming: "Streaming setups, OBS tips, Twitch and YouTube growth",
  "open-source": "Share projects, PRs, and contribution opportunities",
  "job-board": "Jobs, freelance gigs, and career opportunities",
  "portfolio-review": "Share your portfolio for peer feedback",
  announcements: "Official announcements from the Pro Gamers team 📣",
  "rules-and-info": "Community rules and important information 📌",
  "study-together": "Voice channel — join and grind with others 🎮",
  "pair-programming": "Voice channel — find a duo queue partner 👥",
};

const EMOJI_LIST = [
  "👍",
  "👎",
  "❤️",
  "🔥",
  "🎉",
  "😂",
  "😮",
  "😢",
  "😡",
  "🎮",
  "🚀",
  "⭐",
  "💯",
  "🙏",
  "👏",
  "🤔",
  "😎",
  "🤯",
  "💪",
  "🎯",
  "🏆",
  "⚡",
  "😊",
  "🙌",
  "👀",
  "🤝",
  "💬",
  "📌",
  "🎲",
  "🛡",
];

let currentOpenMenu = null;
let currentEmojiTarget = null;
let replyingTo = null;
let collapsedCategories = new Set();
let attachedFile = null; // Store attached file
let activeChannelName = "general";
let currentCommunityId = null;
let currentChannelMessages = []; // last set loaded for the active channel, from the real API

// Two different communities can each have a channel literally named
// "general" — the backend's ChatMessageRecord.channelId has no separate
// community field, so a bare name would make both communities share the
// same messages. Every read/write goes through this compound key instead.
function channelKey(name) {
  return currentCommunityId ? `${currentCommunityId}::${name}` : name;
}

function getChatUser() {
  return typeof getCurrentUser === "function" ? getCurrentUser() : null;
}

function formatMsgTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return "";
  }
}

function renderAttachment(url) {
  const isImage = /\.(png|jpe?g|gif|webp)$/i.test(url);
  const name = url.split("/").pop();
  if (isImage) {
    return `
      <div class="msg-attachment msg-attachment-image" onclick="openAttachmentViewer(this)">
        <div class="msg-attach-preview" style="background-image:url('${escapeAttr(url)}');background-size:cover;background-position:center;"></div>
        <div class="msg-attach-overlay"><span class="msg-attach-view-icon">🔍</span></div>
        <div class="msg-attach-info"><div class="msg-attach-name">${escapeAttr(name)}</div></div>
      </div>`;
  }
  return `
    <a class="msg-attachment msg-attachment-file" href="${escapeAttr(url)}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit;">
      <span class="msg-attach-icon">📎</span>
      <div class="msg-attach-info"><div class="msg-attach-name">${escapeAttr(name)}</div></div>
      <span class="msg-attach-download">⬇</span>
    </a>`;
}

/** Renders one backend ChatMessageRecord as a message-group element. */
function renderMessage(msg) {
  const user = getChatUser();
  const isMine = user?.id && String(msg.authorId) === String(user.id);
  const initials = (msg.authorName || "U").slice(0, 2).toUpperCase();

  const reactionsHtml = Object.entries(msg.reactions || {})
    .filter(([, count]) => count > 0)
    .map(([emoji, count]) => `
      <div class="reaction-pill" onclick="handleReactionClick(this, '${emoji}')"><span>${emoji}</span><span class="reaction-count">${count}</span></div>
    `).join("");

  const attachmentsHtml = (msg.attachments || []).map(renderAttachment).join("");

  return `
    <div class="msg-group" data-message-id="${msg.id}" style="animation: fadeUp 0.25s ease forwards">
      <div class="msg-av ${isMine ? "grad-violet" : "grad-pink"}">${escapeAttr(initials)}</div>
      <div class="msg-body">
        <div class="msg-header">
          <span class="msg-uname" style="color:${isMine ? "var(--accent-light,#818cf8)" : "#F472B6"}">${escapeAttr(msg.authorName || "User")}</span>
          ${isMine ? '<span class="msg-role" style="background:rgba(91,110,245,0.1);color:var(--accent);font-size:9px;padding:1px 6px;border-radius:10px;">You</span>' : ""}
          <span class="msg-time">${formatMsgTime(msg.createdAt)}</span>
        </div>
        ${msg.content ? `<div class="msg-text${isMine ? " self-msg" : ""}">${parseMarkdown(msg.content)}</div>` : ""}
        ${attachmentsHtml}
        ${reactionsHtml ? `<div class="reactions">${reactionsHtml}</div>` : ""}
      </div>
      <div class="msg-actions">
        <div class="act-btn" title="Add Reaction" onclick="openEmojiPicker(this, event)">😊</div>
        <div class="act-btn" title="Reply" onclick="replyToMessage(this)">↩</div>
        <div class="act-btn" title="More" onclick="showMessageMenu(this, event)">⋯</div>
      </div>
    </div>`;
}

/** Loads real messages for a channel from the backend and renders them. */
async function loadAndRenderMessages(channelId) {
  const wrap = document.getElementById("messagesWrap");
  const emptyState = document.getElementById("chatEmptyState");
  if (!wrap) return;

  try {
    currentChannelMessages = await window.API.messages.getByChannel(channelKey(channelId));
  } catch (err) {
    console.warn("[Chat] Could not load messages for", channelId, err.message);
    currentChannelMessages = [];
  }

  wrap.innerHTML = "";
  if (emptyState) wrap.appendChild(emptyState);

  if (currentChannelMessages.length === 0) {
    if (emptyState) emptyState.style.display = "";
  } else {
    if (emptyState) emptyState.style.display = "none";
    currentChannelMessages.forEach((msg) => {
      wrap.insertAdjacentHTML("beforeend", renderMessage(msg));
    });
  }

  renderPinnedPanel();
  scrollToBottom();
}

// The channel-sidebar footer ("who am I") was static markup hardcoded to a
// sample name — it never reflected whoever was actually logged in.
function renderCurrentUserFooter() {
  const user = getChatUser();
  const nameEl = document.querySelector(".ch-footer .user-av-name");
  const avEl = document.querySelector(".ch-footer .user-av");
  const displayName = typeof getUserFullName === "function"
    ? getUserFullName(user)
    : (user?.fullName || user?.name || user?.username || "Guest");
  if (nameEl) nameEl.textContent = displayName;
  if (avEl) {
    const initials = typeof getUserInitials === "function" ? getUserInitials(user) : (displayName || "U").slice(0, 2).toUpperCase();
    avEl.textContent = initials;
  }
}

// The right-hand member sidebar was 100% static sample markup (same three
// fake names for every community, regardless of who actually joined) — this
// replaces it with the community's real membership, same join pattern
// community-page.js already uses for its own member tab.
async function renderChatMembers(communityId) {
  const list = document.querySelector(".mem-sidebar .mem-list");
  if (!list || !communityId) return;

  list.innerHTML = `<div class="mem-group-title">Loading…</div>`;

  let members = [];
  try {
    const [memberships, users] = await Promise.all([
      window.API.memberships.getAll({ communityId }),
      window.API.users.getAll(),
    ]);
    const usersById = new Map(users.map((u) => [String(u.id), u]));
    const community = await window.API.communities.getOne(communityId).catch(() => null);
    members = memberships.map((m) => {
      const user = usersById.get(String(m.userId));
      const isOwner = user && community && String(user.id) === String(community.ownerId);
      const isMod = !isOwner && (user?.role === "moderator" || user?.role === "community_manager");
      return {
        name: user ? (user.username || user.email) : `User #${m.userId}`,
        roleLabel: isOwner ? "Owner" : (isMod ? "Moderator" : "Member"),
        roleClass: isOwner ? "owner-c" : (isMod ? "moderator-c" : ""),
      };
    });
  } catch (err) {
    console.warn("[Chat] Could not load real members:", err.message);
  }

  const onlineCountEls = [document.getElementById("onlineCount"), document.querySelector(".online-count")];
  onlineCountEls.forEach((el) => { if (el) el.textContent = members.length; });

  if (!members.length) {
    list.innerHTML = `<div class="empty-state" style="padding:16px;color:var(--text-3,#888);font-size:12.5px;">No members yet.</div>`;
    return;
  }

  list.innerHTML = `<div class="mem-group-title">Members — ${members.length}</div>` + members.map((m) => `
    <div class="mem-row">
      <div class="m-av grad-purple user-avatar"><span class="m-stat" style="background:var(--success)"></span></div>
      <div class="m-info">
        <div class="m-name">${escapeAttr(m.name)}</div>
        <div class="m-role-tag ${m.roleClass}">${m.roleLabel}</div>
      </div>
    </div>
  `).join("");
}

function renderPinnedPanel() {
  const list = document.getElementById("pinnedList");
  const emptyEl = document.getElementById("pinnedEmpty");
  if (!list) return;
  const pinned = currentChannelMessages.filter((m) => m.pinned);
  if (emptyEl) emptyEl.style.display = pinned.length ? "none" : "";
  list.innerHTML = pinned.map((m) => `
    <div class="pinned-item">
      <div class="pinned-item-meta">
        <span class="pinned-item-author">${escapeAttr(m.authorName)}</span>
        <span class="pinned-item-time">${formatMsgTime(m.createdAt)}</span>
      </div>
      <div class="pinned-item-text">${escapeAttr(m.content)}</div>
    </div>
  `).join("");
}

/** Reaction click from either the emoji picker or an existing reaction pill. */
window.handleReactionClick = async function (el, emoji) {
  const messageId = el.closest("[data-message-id]")?.dataset.messageId;
  if (!messageId) return;
  await sendReaction(messageId, emoji);
};

async function sendReaction(messageId, emoji) {
  const user = getChatUser();
  try {
    await window.API.messages.react(messageId, emoji, { id: user?.id, name: user?.username || user?.name });
  } catch (err) {
    if (window.toast) window.toast("⚠️ Could not react: " + err.message);
    return;
  }
  await loadAndRenderMessages(activeChannelName);
}

window.pinMessage = async function (messageId) {
  try {
    await window.API.messages.pin(messageId);
  } catch (err) {
    if (window.toast) window.toast("⚠️ Could not pin message: " + err.message);
    return;
  }
  await loadAndRenderMessages(activeChannelName);
  showToast("📌 Message pin updated");
};

function escapeAttr(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeCommunityChannel(channel) {
  if (typeof channel === "string") {
    return { name: channel, type: "Text" };
  }
  return {
    name: channel?.name || channel?.label || "general",
    type: channel?.type || "Text",
  };
}

function getChannelIcon(type) {
  if (type === "Voice") return "VC";
  if (type === "Announcement") return "📣";
  return "#";
}

// ==========================================
// 2. MEMBER SIDEBAR TOGGLE
// ==========================================
window.toggleMemberSidebar = function () {
  const sidebar = document.getElementById("memberSidebar");
  const chip = document.getElementById("memberCountChip");
  // More specific selector to avoid conflicts with other toggle icons
  const icon = document.querySelector(".mem-toggle-btn .toggle-icon"); 
  
  if (!sidebar) return;
  
  const isClosed = sidebar.classList.toggle("closed");
  
  // Sync Icon rotation explicitly
  if (icon) {
    icon.style.transform = isClosed ? "rotate(180deg)" : "rotate(0deg)";
  }
  
  // Sync the header chip state (active when sidebar is open)
  if (chip) {
    if (isClosed) {
      chip.classList.remove("active");
    } else {
      chip.classList.add("active");
    }
  }
  
  // Persist state globally
  localStorage.setItem("memberSidebarClosed", isClosed);
  
  // Visual confirmation
  if (typeof showToast === 'function') {
    showToast(isClosed ? "Members list collapsed" : "Members list expanded");
  }
};

// Initialize Sidebar State from LocalStorage
document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("memberSidebar");
  const chip = document.getElementById("memberCountChip");
  const icon = document.querySelector(".mem-toggle-btn .toggle-icon");
  const isClosed = localStorage.getItem("memberSidebarClosed") === "true";
  
  if (sidebar && isClosed) {
    sidebar.classList.add("closed");
    if (icon) icon.style.transform = "rotate(180deg)";
    if (chip) chip.classList.remove("active");
  } else if (sidebar && chip) {
    // Default state: Sidebar is open, chip is active
    chip.classList.add("active");
  }
});

window.logoutUser = function () {
  localStorage.removeItem("nexus_user");
  window.location.href = "login.html";
};

// ==========================================
// 3. SEARCH BAR TOGGLE
// ==========================================
window.toggleSearchBar = function () {
  const bar = document.getElementById("chatSearchBar");
  const btn = document.getElementById("searchToggleBtn");
  if (!bar) return;
  const isOpen = bar.classList.toggle("open");
  if (btn) btn.classList.toggle("active", isOpen);
  if (isOpen) {
    const input = document.getElementById("chatSearchInput");
    if (input) {
      input.value = "";
      input.focus();
    }
    searchMessages("");
  } else {
    clearSearchHighlights();
    const count = document.getElementById("chatSearchCount");
    if (count) count.textContent = "";
  }
};

function clearSearchHighlights() {
  document
    .querySelectorAll(".msg-text.search-hidden")
    .forEach((el) =>
      el
        .closest(".msg-group, .msg-cont")
        ?.classList.remove("search-hidden-row"),
    );
  document.querySelectorAll(".search-highlight").forEach((el) => {
    el.outerHTML = el.textContent;
  });
}

window.searchMessages = function (query) {
  const wrap = document.getElementById("messagesWrap");
  const countEl = document.getElementById("chatSearchCount");
  if (!wrap) return;

  const q = query.trim().toLowerCase();
  const rows = wrap.querySelectorAll(".msg-group, .msg-cont");
  let matchCount = 0;

  rows.forEach((row) => {
    const textEl = row.querySelector(".msg-text");
    if (!textEl) return;
    const rawText = textEl.textContent;

    if (!q) {
      row.style.display = "";
      return;
    }

    const lower = rawText.toLowerCase();
    if (lower.includes(q)) {
      row.style.display = "";
      matchCount++;
      // Highlight — simple approach
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`(${escaped})`, "gi");
      textEl.innerHTML =
        textEl.innerHTML.replace(/<[^>]*>/g, (m) => m) ||
        textEl.textContent.replace(
          re,
          '<mark class="search-highlight">$1</mark>',
        );
    } else {
      row.style.display = "none";
    }
  });

  if (countEl) {
    countEl.textContent = q
      ? matchCount > 0
        ? `${matchCount} result${matchCount !== 1 ? "s" : ""}`
        : "No results"
      : "";
  }
};

// ==========================================
// 4. PINNED PANEL TOGGLE
// ==========================================
window.togglePinnedPanel = function () {
  const panel = document.getElementById("pinnedPanel");
  const btn = document.getElementById("pinnedToggleBtn");
  if (!panel) return;
  const isOpen = panel.classList.toggle("open");
  if (btn) btn.classList.toggle("active", isOpen);
};

// Pin/unpin now goes through window.pinMessage() (real /messages/:id/pin call),
// with the pinned panel re-rendered from real data by renderPinnedPanel().

// ==========================================
// 5. CHANNEL SIDEBAR — SEARCH & COLLAPSE
// ==========================================
window.filterChannels = function (query) {
  const q = query.trim().toLowerCase();
  const categories = document.querySelectorAll(".ch-category");

  categories.forEach((cat) => {
    const items = cat.querySelectorAll(".ch-row");
    let anyVisible = false;

    items.forEach((row) => {
      const lbl = row.querySelector(".ch-lbl");
      const text = lbl ? lbl.textContent.toLowerCase() : "";
      const match = !q || text.includes(q);
      row.style.display = match ? "" : "none";
      if (match) anyVisible = true;
    });

    cat.style.display = !q || anyVisible ? "" : "none";

    // Force expand categories that have results during search
    const itemsContainer = cat.querySelector(".ch-category-items");
    if (q && anyVisible && itemsContainer) {
      itemsContainer.style.display = "";
    }
  });
};

window.toggleCategory = function (categoryKey) {
  const cat = document.querySelector(
    `.ch-category[data-category="${categoryKey}"]`,
  );
  if (!cat) return;
  const items = cat.querySelector(".ch-category-items");
  const arrow = cat.querySelector(".cat-arrow");
  if (!items) return;

  const isCollapsed = collapsedCategories.has(categoryKey);
  if (isCollapsed) {
    collapsedCategories.delete(categoryKey);
    items.style.maxHeight = items.scrollHeight + "px";
    setTimeout(() => {
      items.style.maxHeight = "";
      items.style.display = "";
    }, 200);
    if (arrow) arrow.textContent = "▾";
  } else {
    collapsedCategories.add(categoryKey);
    items.style.maxHeight = items.scrollHeight + "px";
    requestAnimationFrame(() => {
      items.style.maxHeight = "0";
    });
    setTimeout(() => {
      items.style.display = "none";
    }, 200);
    if (arrow) arrow.textContent = "▸";
  }
};

window.setChannel = function (el, name, type) {
  activeChannelName = name || "general";
  document
    .querySelectorAll(".ch-row")
    .forEach((r) => r.classList.remove("active"));
  el.classList.add("active");

  const nameDisplay = document.getElementById("activeChanName");
  const hashDisplay = document.getElementById("activeChanHash");
  const topicDisplay = document.getElementById("activeChanTopic");
  const inputField = document.getElementById("msgInput");
  const searchInput = document.getElementById("chatSearchInput");

  if (nameDisplay) nameDisplay.textContent = name;
  if (hashDisplay) hashDisplay.textContent = type;
  if (topicDisplay) topicDisplay.textContent = CHANNEL_TOPICS[name] || "";
  if (inputField) {
    const prefix = type === "#" || type === "📣" || type === "📌" ? "#" : "";
    inputField.placeholder = `Message ${prefix}${name}…`;
    inputField.focus();
  }
  if (searchInput) {
    searchInput.placeholder = `Search messages in ${type === "#" ? "#" : ""}${name}…`;
  }

  const badge = el.querySelector(".ch-unread");
  if (badge) badge.remove();

  loadAndRenderMessages(activeChannelName);
};

// ==========================================
// 6. EMOJI PICKER
// ==========================================

/** Ensure the emoji grid is built exactly once. */
function ensureEmojiGridBuilt() {
  const grid = document.getElementById("emojiPickerGrid");
  if (!grid || grid.dataset.built) return;
  EMOJI_LIST.forEach((emoji) => {
    const btn2 = document.createElement("button");
    btn2.className = "emoji-btn";
    btn2.textContent = emoji;
    btn2.dataset.emoji = emoji;
    // onclick is set dynamically each time picker opens — see rewireEmojiGrid
    grid.appendChild(btn2);
  });
  grid.dataset.built = "true";
}

/** Rewire all emoji buttons to call the provided callback. */
function rewireEmojiGrid(callback) {
  const grid = document.getElementById("emojiPickerGrid");
  if (!grid) return;
  grid.querySelectorAll(".emoji-btn").forEach((btn2) => {
    // Replace onclick every time so there are no stale closures
    btn2.onclick = (e) => {
      e.stopPropagation();
      callback(btn2.dataset.emoji);
    };
  });
}

function positionPicker(picker, anchorRect) {
  picker.style.top = "";
  picker.style.bottom = "";
  picker.style.left = "";

  const pickerWidth = 320; // Default width of emoji picker
  const pickerHeight = 350; // Approximated height

  let top = anchorRect.top - pickerHeight - 8;
  let left = anchorRect.left;

  // Flip below if not enough space above
  if (top < 8) top = anchorRect.bottom + 8;
  // Keep within right edge
  if (left + pickerWidth > window.innerWidth - 8)
    left = window.innerWidth - pickerWidth - 8;
  if (left < 8) left = 8;

  picker.style.top = `${top}px`;
  picker.style.left = `${left}px`;
  picker.classList.add("open");
}

/** Open emoji picker anchored to a message's 😊 act-btn. */
window.openEmojiPicker = function (btn, event) {
  if (event) event.stopPropagation();

  const picker = document.getElementById("emojiPicker");
  if (!picker) return;

  if (currentOpenMenu) {
    currentOpenMenu.remove();
    currentOpenMenu = null;
  }

  // Toggle: close if already open for same button
  if (currentEmojiTarget === btn && picker.classList.contains("open")) {
    picker.classList.remove("open");
    currentEmojiTarget = null;
    return;
  }

  currentEmojiTarget = btn;
  ensureEmojiGridBuilt();

  // Wire up: clicking an emoji sends a real reaction for the parent message
  rewireEmojiGrid((emoji) => {
    const msgRow = currentEmojiTarget
      ? currentEmojiTarget.closest(".msg-group, .msg-cont")
      : null;
    const messageId = msgRow?.dataset.messageId;
    if (messageId) sendReaction(messageId, emoji);
    picker.classList.remove("open");
    currentEmojiTarget = null;
  });

  const rect = btn.getBoundingClientRect();
  positionPicker(picker, rect);
};

/** Open emoji picker anchored to the toolbar emoji button — inserts into textarea. */
window.openToolbarEmoji = function () {
  const picker = document.getElementById("emojiPicker");
  if (!picker) return;

  if (currentEmojiTarget === "toolbar" && picker.classList.contains("open")) {
    picker.classList.remove("open");
    currentEmojiTarget = null;
    return;
  }

  currentEmojiTarget = "toolbar";
  ensureEmojiGridBuilt();

  // Wire up: clicking an emoji inserts it into the message input
  rewireEmojiGrid((emoji) => {
    insertAtCursor(emoji);
    picker.classList.remove("open");
    currentEmojiTarget = null;
  });

  const toolbarBtn = document.querySelector('.tb-btn[title="Emoji"]');
  const rect = toolbarBtn
    ? toolbarBtn.getBoundingClientRect()
    : {
        top: window.innerHeight - 200,
        bottom: window.innerHeight - 200,
        left: 300,
      };
  positionPicker(picker, rect);
};

// ==========================================
// 7. REPLY BAR
// ==========================================
window.replyToMessage = function (btn) {
  const msgGroup = btn.closest(".msg-group");
  let userName = "User";
  if (msgGroup) {
    const nameEl = msgGroup.querySelector(".msg-uname");
    if (nameEl) userName = nameEl.textContent.trim();
  }

  replyingTo = userName;
  const replyBar = document.getElementById("replyBar");
  const replyBarName = document.getElementById("replyBarName");
  if (replyBar) replyBar.style.display = "";
  if (replyBarName) replyBarName.textContent = userName;

  const input = document.getElementById("msgInput");
  if (input) input.focus();
};

window.cancelReply = function () {
  replyingTo = null;
  const replyBar = document.getElementById("replyBar");
  if (replyBar) replyBar.style.display = "none";
};

// ==========================================
// 8. MORE MENU (⋯)
// ==========================================
window.showMessageMenu = function (btn, event) {
  if (event) event.stopPropagation();

  if (currentOpenMenu) {
    currentOpenMenu.remove();
    currentOpenMenu = null;
  }
  if (document.getElementById("emojiPicker")?.classList.contains("open")) {
    document.getElementById("emojiPicker").classList.remove("open");
  }

  const msgGroup = btn.closest(".msg-group, .msg-cont");
  let msgText = "";
  const messageId = msgGroup?.dataset.messageId;
  if (msgGroup) {
    const textEl = msgGroup.querySelector(".msg-text");
    if (textEl) msgText = textEl.textContent.trim();
  }

  const menu = document.createElement("div");
  menu.className = "msg-menu show";

  const items = [
    {
      icon: "📋",
      label: "Copy Text",
      action: () => {
        navigator.clipboard
          .writeText(msgText)
          .then(() => showToast("Message copied!"))
          .catch(() => showToast("Copy failed"));
      },
    },
    ...(messageId ? [{
      icon: "📌",
      label: "Pin Message",
      action: () => {
        pinMessage(messageId);
      },
    }] : []),
    { separator: true },
    {
      icon: "🚩",
      label: "Report Message",
      danger: true,
      action: () => {
        window.location.href = messageId
          ? `report.html?targetType=post&targetId=${encodeURIComponent(messageId)}&channelId=${encodeURIComponent(activeChannelName)}`
          : "report.html";
      },
    },
  ];

  items.forEach((item) => {
    if (item.separator) {
      const sep = document.createElement("div");
      sep.className = "msg-menu-divider";
      menu.appendChild(sep);
      return;
    }

    const menuItem = document.createElement("div");
    menuItem.className = "msg-menu-item" + (item.danger ? " danger" : "");
    menuItem.innerHTML = `<span>${item.icon}</span> <span>${item.label}</span>`;

    menuItem.onclick = (event) => {
      event.stopPropagation();
      item.action();
      menu.remove();
      currentOpenMenu = null;
    };

    menu.appendChild(menuItem);
  });

  document.body.appendChild(menu);

  const rect = btn.getBoundingClientRect();
  menu.style.top = `${rect.bottom + 5}px`;
  menu.style.left = `${Math.max(8, rect.right - 170)}px`;

  currentOpenMenu = menu;
};

// ==========================================
// 9. GLOBAL CLICK HANDLER (CLOSE MENUS)
// ==========================================
document.addEventListener("click", function (e) {
  // Close context menu if clicked outside
  if (
    currentOpenMenu &&
    !currentOpenMenu.contains(e.target) &&
    !e.target.closest('.act-btn[title="More"]')
  ) {
    currentOpenMenu.remove();
    currentOpenMenu = null;
  }

  // Close emoji picker if clicked outside
  const picker = document.getElementById("emojiPicker");
  if (picker && picker.classList.contains("open")) {
    if (
      !picker.contains(e.target) &&
      !e.target.closest('.act-btn[title="Add Reaction"]') &&
      !e.target.closest('.tb-btn[title="Emoji"]')
    ) {
      picker.classList.remove("open");
      currentEmojiTarget = null;
    }
  }
});

// ==========================================
// 10. REACTIONS
// ==========================================
// Real reactions go through window.handleReactionClick() / sendReaction() near
// the top of this file, which call POST /messages/:id/reactions and re-render
// from the server's response. The backend only supports incrementing a count
// per emoji (no per-user un-react), so there's no "toggle off" here — clicking
// an emoji always adds one, matching what the API actually does.

// ==========================================
// 11. MENTION & TOOLBAR FORMATTING
// ==========================================
window.insertMention = function () {
  const ta = document.getElementById("msgInput");
  if (!ta) return;
  ta.focus();

  const start = ta.selectionStart;
  const end = ta.selectionEnd;

  // Get list of online members from the member list
  const members = [];
  document
    .querySelectorAll('.mem-row:not([style*="opacity"])')
    .forEach((row) => {
      const nameEl = row.querySelector(".m-name");
      if (nameEl) members.push(nameEl.textContent.trim());
    });

  // For now, insert @ and let user type the name
  // Could be enhanced with an autocomplete dropdown
  ta.setRangeText("@", start, end, "end");
  ta.dispatchEvent(new Event("input"));
  ta.focus();
};

window.formatText = function (type) {
  const ta = document.getElementById("msgInput");
  if (!ta) return;
  ta.focus();

  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const selected = ta.value.substring(start, end);
  let replacement = "";

  switch (type) {
    case "bold":
      replacement = `**${selected || "bold text"}**`;
      break;
    case "italic":
      replacement = `_${selected || "italic text"}_`;
      break;
    case "code":
      replacement = `\`${selected || "code"}\``;
      break;
    default:
      return;
  }

  ta.setRangeText(replacement, start, end, "end");
  ta.dispatchEvent(new Event("input"));
};

window.triggerFileAttach = function () {
  const fileInput = document.getElementById("fileInput");
  if (fileInput) fileInput.click();
};

window.handleFileAttach = function (input) {
  const file = input.files[0];
  if (!file) return;

  // Validate file size (max 25MB)
  const maxSize = 25 * 1024 * 1024;
  if (file.size > maxSize) {
    showToast("❌ File too large (max 25MB)");
    input.value = "";
    return;
  }

  // Store the file
  attachedFile = file;

  // Display attachment preview
  displayAttachmentPreview(file);

  showToast(`📎 Attached: ${file.name}`);
  input.value = "";
};

window.displayAttachmentPreview = function (file) {
  // Remove existing preview if any
  const existingPreview = document.getElementById("attachmentPreview");
  if (existingPreview) existingPreview.remove();

  const preview = document.createElement("div");
  preview.id = "attachmentPreview";
  preview.className = "attachment-preview";

  const fileSize = (file.size / 1024).toFixed(1);
  const fileType = file.type || "unknown";
  const fileIcon = getFileIcon(file.type);

  preview.innerHTML = `
    <div class="attachment-item">
      <span class="attachment-icon">${fileIcon}</span>
      <div class="attachment-info">
        <div class="attachment-name">${file.name}</div>
        <div class="attachment-size">${fileSize} KB</div>
      </div>
      <button class="attachment-remove" onclick="removeAttachment()" title="Remove">✕</button>
    </div>
  `;

  const inputArea = document.querySelector(".input-area");
  if (inputArea) inputArea.insertBefore(preview, inputArea.firstChild);
};

window.removeAttachment = function () {
  attachedFile = null;
  const preview = document.getElementById("attachmentPreview");
  if (preview) preview.remove();
  const fileInput = document.getElementById("fileInput");
  if (fileInput) fileInput.value = "";
  showToast("Attachment removed");
};

window.openAttachmentViewer = function (element) {
  const preview = element.querySelector(".msg-attach-preview");
  const bgImage = preview.style.backgroundImage;

  if (!bgImage || bgImage === "none") return;

  // Extract URL from background-image
  const imageUrl = bgImage.slice(5, -2);

  // Create modal viewer
  const modal = document.createElement("div");
  modal.className = "attachment-modal";
  modal.innerHTML = `
    <div class="attachment-modal-content">
      <button class="attachment-modal-close" onclick="this.closest('.attachment-modal').remove()">×</button>
      <img src="${imageUrl}" alt="Attachment preview" class="attachment-modal-image" />
    </div>
  `;

  modal.onclick = function (e) {
    if (e.target === modal) modal.remove();
  };

  document.body.appendChild(modal);
};

// Non-image attachments now render as real <a href download> links (see
// renderAttachment()) so there's no separate fake download handler anymore.

function getFileIcon(mimeType) {
  if (!mimeType) return "📄";
  if (mimeType.startsWith("image")) return "🖼";
  if (mimeType.startsWith("video")) return "🎥";
  if (mimeType.startsWith("audio")) return "🎵";
  if (mimeType.includes("pdf")) return "📕";
  if (mimeType.includes("zip") || mimeType.includes("rar")) return "📦";
  if (mimeType.includes("spreadsheet") || mimeType.includes("sheet"))
    return "📊";
  if (mimeType.includes("document") || mimeType.includes("word")) return "📄";
  return "📎";
}

function insertAtCursor(text) {
  const ta = document.getElementById("msgInput");
  if (!ta) return;
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  ta.setRangeText(text, start, end, "end");
  ta.dispatchEvent(new Event("input"));
  ta.focus();
}

// ==========================================
// 12. UTILITIES
// ==========================================
function scrollToBottom() {
  const wrap = document.getElementById("messagesWrap");
  if (wrap) {
    wrap.scrollTop = wrap.scrollHeight;
  }
}

function copyCode(btn) {
  const pre = btn.closest(".code-block")?.querySelector("pre");
  if (!pre) return;
  navigator.clipboard
    .writeText(pre.textContent.trim())
    .then(() => {
      btn.textContent = "Copied!";
      setTimeout(() => (btn.textContent = "Copy"), 1500);
    })
    .catch(() => {
      btn.textContent = "Error";
      setTimeout(() => (btn.textContent = "Copy"), 1500);
    });
}
window.copyCode = copyCode;

const parseMarkdown = (text) => {
  let escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  escaped = escaped.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  escaped = escaped.replace(/_(.*?)_/g, "<em>$1</em>");
  escaped = escaped.replace(/`(.*?)`/g, "<code>$1</code>");
  escaped = escaped.replace(
    /@([a-zA-Z0-9\s]+)/g,
    '<span class="mention">@$1</span>',
  );
  escaped = escaped.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" style="color:var(--accent)">$1</a>',
  );
  // Bullet list
  escaped = escaped.replace(/^•\s(.+)/gm, "<li>$1</li>");
  // Numbered list
  escaped = escaped.replace(/^\d+\.\s(.+)/gm, "<li>$1</li>");

  return escaped;
};

function showToast(message) {
  const existing = document.getElementById("nexus-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "nexus-toast";
  toast.textContent = message;

  Object.assign(toast.style, {
    position: "fixed",
    bottom: "80px",
    left: "50%",
    transform: "translateX(-50%) translateY(20px)",
    background: "var(--accent)",
    color: "#fff",
    padding: "10px 22px",
    borderRadius: "30px",
    fontSize: "13px",
    fontWeight: "600",
    zIndex: "99999",
    boxShadow: "0 8px 24px rgba(91, 110, 245, 0.4)",
    opacity: "0",
    transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
    fontFamily: '"DM Sans", sans-serif',
    letterSpacing: "0.2px",
    pointerEvents: "none",
  });

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";
  }, 10);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(10px)";
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}
window.showToast = showToast;

// ==========================================
// 13. MESSAGING LOGIC
// ==========================================
window.autoResize = function (ta) {
  ta.style.height = "auto";
  ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
};

window.handleKey = function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    window.sendMessage();
  }
};

window.toggleMute = function (btn) {
  btn.classList.toggle("muted");
};

window.toggleDeafen = function (btn) {
  btn.classList.toggle("deafened");
};

window.sendMessage = async function () {
  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if (!text && !attachedFile) return;

  const sendBtn = document.querySelector(".send-btn");
  if (sendBtn) sendBtn.disabled = true;

  // Real upload first, if there's a file — the message row only gets created
  // once we have a real URL to attach, so a failed upload doesn't send a
  // message silently missing its attachment.
  let attachmentUrls = [];
  if (attachedFile) {
    if (!window.API?.uploads) {
      showToast("⚠️ Upload service unavailable");
      if (sendBtn) sendBtn.disabled = false;
      return;
    }
    try {
      const result = await window.API.uploads.upload(attachedFile);
      attachmentUrls = [result.absoluteUrl];
    } catch (err) {
      showToast("⚠️ Attachment upload failed: " + err.message);
      if (sendBtn) sendBtn.disabled = false;
      return;
    }
  }

  const user = getChatUser();
  try {
    await window.API.messages.create({
      channelId: channelKey(activeChannelName),
      communityId: currentCommunityId || undefined,
      authorId: user?.id,
      authorName: user?.username || user?.name || "User",
      content: text,
      attachments: attachmentUrls,
    });
  } catch (err) {
    showToast("⚠️ Message failed to send: " + err.message);
    if (sendBtn) sendBtn.disabled = false;
    return;
  }

  if (replyingTo) cancelReply();
  input.value = "";
  input.style.height = "auto";
  attachedFile = null;
  const preview = document.getElementById("attachmentPreview");
  if (preview) preview.remove();
  const fileInput = document.getElementById("fileInput");
  if (fileInput) fileInput.value = "";
  if (sendBtn) sendBtn.disabled = false;

  await loadAndRenderMessages(activeChannelName);
};

// ==========================================
// 14. INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
  if (typeof enforcePageAccess === "function" && !enforcePageAccess()) return;

  renderCurrentUserFooter();

  // Fetch community details to render channels
  const urlParams = new URLSearchParams(window.location.search);
  const commId = urlParams.get("community") || sessionStorage.getItem("currentCommunityId") || urlParams.get("id");
  const requestedChannel = urlParams.get("channel") || sessionStorage.getItem("selectedChannel");
  let community = null;

  if (commId && window.API && window.API.communities) {
    try {
      community = await window.API.communities.getOne(commId);
      currentCommunityId = community?.id ?? null;
      renderChatMembers(currentCommunityId);
    } catch (err) {
      console.error("Failed to load community details for chat", err);
    }
  }

  const channelsList = document.getElementById("channelsList");
  if (channelsList && community) {
    // Update community name/icon
    const chatCommName = document.getElementById("chatCommName");
    const chatCommIcon = document.getElementById("chatCommIcon");
    if (chatCommName) chatCommName.textContent = community.name || "Community";
    if (chatCommIcon) chatCommIcon.textContent = (community.icon && typeof community.icon === 'string') ? community.icon : "🎮";

    let channelsHTML = "";
    const communityChannels = Array.isArray(community.channels)
      ? community.channels.map(normalizeCommunityChannel).filter(ch => ch.name)
      : [];

    if (communityChannels.length > 0) {
      const categories = {};
      communityChannels.forEach(ch => {
        const type = ch.type || "Text";
        if (!categories[type]) categories[type] = [];
        categories[type].push(ch);
      });

      for (const [type, channels] of Object.entries(categories)) {
        channelsHTML += `
          <div class="ch-category" data-category="${type.toLowerCase()}">
            <div class="ch-group-lbl" onclick="toggleCategory('${type.toLowerCase()}')">
              <span class="cat-arrow">▾</span> ${type.toUpperCase()} CHANNELS
            </div>
            <div class="ch-category-items">
              ${channels.map(ch => `
                <div class="ch-row" onclick="setChannel(this, '${escapeAttr(ch.name)}', '${getChannelIcon(ch.type)}')">
                  <span class="ch-type">${getChannelIcon(ch.type)}</span>
                  <span class="ch-lbl">${escapeAttr(ch.name)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }
    } else {
      channelsHTML = `
        <div class="ch-category" data-category="text">
          <div class="ch-group-lbl">TEXT CHANNELS</div>
          <div class="ch-category-items">
             <div class="ch-row active" onclick="setChannel(this, 'general', '#')">
               <span class="ch-type">#</span><span class="ch-lbl">general</span>
             </div>
          </div>
        </div>
      `;
    }
    channelsList.innerHTML = channelsHTML;
  }

  // Restore selected channel from URL/session (from community page)
  const selectedChannel = requestedChannel;
  const fromCommunityPage = sessionStorage.getItem("fromCommunityPage");

  if (selectedChannel) {
    const channelName = decodeURIComponent(selectedChannel).replace("#", "");
    const rows = document.querySelectorAll(".ch-row");
    let found = false;
    rows.forEach((row) => {
      const channelLabel = row.querySelector(".ch-lbl");
      if (channelLabel && channelLabel.textContent.trim().toLowerCase() === channelName.toLowerCase()) {
        const icon = row.querySelector(".ch-type");
        const iconText = icon ? icon.textContent : "#";
        setChannel(row, channelName, iconText);
        found = true;
      }
    });
    
    // Fallback if not found
    if (!found && rows.length > 0) {
      const firstRow = rows[0];
      const name = firstRow.querySelector(".ch-lbl")?.textContent || "general";
      const icon = firstRow.querySelector(".ch-type")?.textContent || "#";
      setChannel(firstRow, name, icon);
    }

    sessionStorage.removeItem("selectedChannel");
    sessionStorage.removeItem("fromCommunityPage");
  } else {
      // Default to first channel
      const rows = document.querySelectorAll(".ch-row");
      if (rows.length > 0) {
          const firstRow = rows[0];
          const name = firstRow.querySelector(".ch-lbl")?.textContent || "general";
          const icon = firstRow.querySelector(".ch-type")?.textContent || "#";
          setChannel(firstRow, name, icon);
      }
  }

  scrollToBottom();

  // Category items smooth transition setup
  document.querySelectorAll(".ch-category-items").forEach((items) => {
    items.style.transition = "max-height 0.2s ease, opacity 0.2s ease";
    items.style.overflow = "hidden";
  });

  // Core animation for new messages
  const style = document.createElement("style");
  style.textContent = `
        @keyframes fadeUp {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
        }
        .send-btn { color: #fff; }
    `;
  document.head.appendChild(style);

  // Emoji picker close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const picker = document.getElementById("emojiPicker");
      if (picker) picker.classList.remove("open");
      if (currentOpenMenu) {
        currentOpenMenu.remove();
        currentOpenMenu = null;
      }

      const searchBar = document.getElementById("chatSearchBar");
      if (searchBar && searchBar.classList.contains("open")) {
        toggleSearchBar();
      }

      const pinnedPanel = document.getElementById("pinnedPanel");
      if (pinnedPanel && pinnedPanel.classList.contains("open")) {
        togglePinnedPanel();
      }
    }
  });
});
