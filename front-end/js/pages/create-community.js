/**
 * Gameunity — Create Community / Channel Logic
 * Handles multi-step wizards, live previews, and dynamic form generation.
 */

// ==========================================
// 1. STATE & CONSTANTS
// ==========================================
let currentStep = 1;
const totalSteps = 4;
let activePage = 'community';
let toastTimeout;
let pendingBannerUrl = null; // set once the real upload to /api/uploads resolves
let pendingIconUrl = null;
let selectedVisibility = 'public';

// ==========================================
// 2. CORE NAVIGATION
// ==========================================

/**
 * Switches between "Create Community" and "Create Channel" modes
 */
window.switchPage = function(el, page) {
    document.querySelectorAll('.spt').forEach(t => t.classList.remove('on'));
    el.classList.add('on');
    activePage = page;

    // Toggle Visibility
    document.getElementById('v-community').classList.toggle('on', page === 'community');
    document.getElementById('v-channel').classList.toggle('on', page === 'channel');

    // Update Header & Buttons
    document.getElementById('bc-cur').textContent = page === 'community' ? 'Create Community' : 'Create Channel';
    document.getElementById('btn-next').textContent = page === 'channel' ? 'Create Channel' : 'Continue →';

    // UI Cleanup
    document.getElementById('bb-step').style.display = page === 'channel' ? 'none' : 'block';
    document.getElementById('btn-back').style.display = 'none';

    if (page === 'community') goStep(1);
    if (page === 'channel') populateChannelCommunityPicker();
};

/** Replaces the 2 hardcoded sample communities with the real list from the API. */
async function populateChannelCommunityPicker() {
    const select = document.getElementById('ch-community-select');
    if (!select || select.dataset.loaded) return;

    if (!window.API?.communities) return;
    try {
        const communities = await window.API.communities.getAll();
        if (communities.length > 0) {
            select.innerHTML = communities
                .map((c) => `<option value="${c.id}">${(c.name || 'Untitled').replace(/</g, '&lt;')}</option>`)
                .join('');
            select.dataset.loaded = 'true';
        }
    } catch (err) {
        console.warn('[CreateCommunity] Could not load communities for channel picker:', err.message);
    }
}

/**
 * Validates the fields of a specific step
 */
window.isStepValid = function (stepNum) {
  // Step 1 Validation
  if (stepNum === 1) {
    const nameInput = document.getElementById("comm-name");
    const descInput = document.getElementById("comm-desc");

    if (window.NexusValidator) {
      const valid = window.NexusValidator.validateForm([
        {
          element: nameInput,
          validators: [
            {
              check: (v) => window.NexusValidator.isRequired(v),
              message: "Community name is required",
            },
            {
              check: (v) => window.NexusValidator.minLength(v, 3),
              message: "Name must be at least 3 characters",
            },
          ],
        },
        {
          element: descInput,
          validators: [
            {
              check: (v) => window.NexusValidator.isRequired(v),
              message: "Community description is required",
            },
            {
              check: (v) => window.NexusValidator.minLength(v, 10),
              message: "Description must be at least 10 characters",
            },
          ],
        },
      ]);
      return valid;
    } else {
      return !!(nameInput?.value.trim() && descInput?.value.trim());
    }
  }

  // Step 2 Validation (Website URL)
  if (stepNum === 2) {
    const websiteInput = document.getElementById("comm-website");
    const urlError = document.getElementById("url-error");

    // Reset the error styles just in case they fixed it
    if (urlError) urlError.style.display = "none";
    if (websiteInput) websiteInput.style.borderColor = "";

    if (websiteInput && websiteInput.value.trim() !== "") {
      const urlPattern =
        /^(https?:\/\/)?([\w\-]+(\.[\w\-]+)+)([\/\w\-]*)*\/?$/i;

      if (!urlPattern.test(websiteInput.value.trim())) {
        // Show the red text and make the box border red
        if (urlError) urlError.style.display = "block";
        websiteInput.style.borderColor = "var(--error)";
        return false; // Stops them from going to Step 3
      }
    }
  }

  // Steps 3 and 4 pass automatically
  return true;
};;

window.triggerBannerUpload = function () {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";

  fileInput.onchange = async function (e) {
    const file = e.target.files[0];
    if (!file) return;

    document.querySelectorAll(".bp-item").forEach((b) => b.classList.remove("on"));

    // Instant local preview while the real upload is in flight.
    const reader = new FileReader();
    reader.onload = function (event) {
      const previewBanner = document.querySelector(".pc-banner");
      if (previewBanner) {
        previewBanner.style.background = `url(${event.target.result})`;
        previewBanner.style.backgroundSize = "cover";
        previewBanner.style.backgroundPosition = "center";
      }
    };
    reader.readAsDataURL(file);

    if (!window.API?.uploads) {
      window.toast("⚠️ Upload service unavailable — banner won't be saved.");
      return;
    }
    try {
      const result = await window.API.uploads.upload(file);
      pendingBannerUrl = result.absoluteUrl;
      window.toast(`✅ Custom banner ${file.name} uploaded!`);
    } catch (err) {
      pendingBannerUrl = null;
      window.toast(`⚠️ Banner upload failed: ${err.message}`);
    }
  };

  fileInput.click();
};

window.triggerIconUpload = function () {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";

  fileInput.onchange = async function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const previewIcon = document.getElementById("pc-ico");
    const reader = new FileReader();
    reader.onload = function (event) {
      if (previewIcon) {
        previewIcon.textContent = "";
        previewIcon.style.backgroundImage = `url(${event.target.result})`;
        previewIcon.style.backgroundSize = "cover";
        previewIcon.style.backgroundPosition = "center";
      }
    };
    reader.readAsDataURL(file);

    if (!window.API?.uploads) {
      window.toast("⚠️ Upload service unavailable — icon won't be saved.");
      return;
    }
    try {
      const result = await window.API.uploads.upload(file);
      pendingIconUrl = result.absoluteUrl;
      window.toast(`✅ Custom icon ${file.name} uploaded!`);
    } catch (err) {
      pendingIconUrl = null;
      window.toast(`⚠️ Icon upload failed: ${err.message}`);
    }
  };

  fileInput.click();
};

/**
 * Handles Step-by-Step Wizard Logic
 */
window.goStep = function (n) {
  if (activePage !== "community") return;

  // --- NEW VALIDATION LOGIC ---
  // If the user is trying to move FORWARD, we must check if they are allowed
  if (n > currentStep) {
    // 1. Prevent skipping steps entirely (e.g., jumping from Step 1 to Step 3)
    if (n > currentStep + 1) {
      window.toast("⚠️ Please complete the steps in order.");
      return;
    }

    // 2. Validate the current step before allowing them to leave it
    if (!window.isStepValid(currentStep)) {
      window.toast("⚠️ Please fix the errors before continuing.");
      return; // Stops the navigation
    }
  }
  // -----------------------------

  for (let i = 1; i <= totalSteps; i++) {
    const stepIndicator = document.getElementById("s" + i);
    const targetNum = document.getElementById("sn" + i);

    stepIndicator.classList.remove("on", "done");

    if (i < n) {
      stepIndicator.classList.add("done");
      if (targetNum) targetNum.textContent = "✓";
    } else if (i === n) {
      stepIndicator.classList.add("on");
      if (targetNum) targetNum.textContent = i;
    } else {
      if (targetNum) targetNum.textContent = i;
    }

    // Show/Hide form views
    const stepView = document.getElementById("step-" + i);
    if (stepView) {
      stepView.classList.toggle("on", i === n);
    }
  }

  currentStep = n;

  // Update Progress Bar
  const progFill = document.getElementById("prog");
  if (progFill) progFill.style.width = (n / totalSteps) * 100 + "%";

  // Update Bottom Bar
  document.getElementById("bb-step").textContent = `Step ${n} of ${totalSteps}`;
  document.getElementById("btn-back").style.display = n > 1 ? "block" : "none";
  document.getElementById("btn-next").textContent =
    n === totalSteps ? "🚀 Create Community" : "Continue →";
};

window.nextStep = async function () {
  // Channel Creation Validation (Single Page)
  if (activePage === "channel") {
    const cName = document.getElementById("ch-name-main");
    const cTopic = document.getElementById("ch-topic-main");
    if (cName && cTopic && window.NexusValidator) {
      const valid = window.NexusValidator.validateForm([
        {
          element: cName,
          validators: [
            {
              check: (v) => window.NexusValidator.isRequired(v),
              message: "Channel name is required",
            },
          ],
        },
        {
          element: cTopic,
          validators: [
            {
              check: (v) => window.NexusValidator.isRequired(v),
              message: "Channel topic is required",
            },
          ],
        },
      ]);
      if (!valid) {
        window.toast("⚠️ Please fill out all required channel fields.");
        return;
      }
    } else if (!cName?.value.trim() || !cTopic?.value.trim()) {
      window.toast("⚠️ Channel name and topic are required");
      return;
    }

    const communitySelect = document.getElementById('ch-community-select');
    const communityId = communitySelect?.value;
    if (!communityId) {
      window.toast("⚠️ Select a community first");
      return;
    }

    const typeLabel = document.querySelector('.ctp.on')?.textContent.trim() || '💬 Text';
    const channelType = typeLabel.includes('Voice') ? 'Voice'
      : typeLabel.includes('Announcement') ? 'Announcement'
      : typeLabel.includes('Forum') ? 'Forum'
      : typeLabel.includes('Events') ? 'Events'
      : 'Text';
    const newChannel = {
      id: String(Date.now()),
      name: cName.value.trim().toLowerCase().replace(/\s+/g, '-'),
      type: channelType,
    };

    try {
      const community = await window.API.communities.getOne(communityId);
      const existingChannels = Array.isArray(community.channels) ? community.channels : [];
      await window.API.communities.update(communityId, { channels: [...existingChannels, newChannel] });
      window.toast(`✅ #${newChannel.name} created in ${community.name}!`);
      cName.value = '';
      cTopic.value = '';
    } catch (err) {
      window.toast("⚠️ Could not create channel: " + err.message);
    }
    return;
  }

    // Community Creation Wizard Progression
    if (currentStep < totalSteps) {
        window.goStep(currentStep + 1);
    } else {
        // Submitting on final step
        if (window.isStepValid(currentStep)) {
            const communityName = document.getElementById('comm-name')?.value?.trim();
            const communityDesc = document.getElementById('comm-desc')?.value?.trim();
            const categoryEl   = document.querySelector('.cat-item.on .cat-lbl');
            const category     = categoryEl ? categoryEl.textContent.trim() : 'Gaming';
            const user         = typeof getCurrentUser === 'function' ? getCurrentUser() : {};
            const userId       = Number(user?.id) || 3;

            // ── Collect channels from Step 3 wizard ───────────────────
            const channelEls = document.querySelectorAll('#ch-list .ch-item .ch-name');
            const channels   = Array.from(channelEls)
                .map(el => el.textContent.replace(/^#/, '').trim())
                .filter(Boolean);
            // Default channel if wizard list is empty
            if (channels.length === 0) channels.push('general');

            const newComm = {
                name:        communityName,
                description: communityDesc,
                ownerId:     userId,
                tags:        [category.toLowerCase().replace(/\s+/g, '-')],
                channels:    channels,   // ← user-defined channels from Step 3
                icon:        document.getElementById('pc-ico')?.textContent?.trim() || '⚡',
                category:    category,
                slug:        communityName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                memberCount: 1,
                onlineCount: 1,
                visibility:  selectedVisibility,
                ...(pendingBannerUrl ? { banner: pendingBannerUrl, bannerImage: pendingBannerUrl } : {}),
                ...(pendingIconUrl ? { icon: pendingIconUrl } : {}),
            };

            try {
                window.toast('🚀 Creating community…');
                const created = window.API
                    ? await window.API.communities.create(newComm)
                    : null;

                if (created) {
                    const id = String(created.id);

                    // ── Auto-join the creator ────────────────────────────
                    let joinedList = JSON.parse(localStorage.getItem('nexus_joined_communities') || '[]');
                    if (!joinedList.includes(id)) { joinedList.push(id); }
                    localStorage.setItem('nexus_joined_communities', JSON.stringify(joinedList));

                    // ── Track ownership by community ID ──────────────────
                    let ownedIds = JSON.parse(localStorage.getItem('nexus_owned_community_ids') || '[]');
                    if (!ownedIds.includes(id)) { ownedIds.push(id); }
                    localStorage.setItem('nexus_owned_community_ids', JSON.stringify(ownedIds));

                    window.toast('🎉 Community created! Redirecting…');
                    setTimeout(() => { window.location.href = `community-page.html?id=${created.id}`; }, 1500);
                } else {
                    window.toast('⚠️ Could not create community — API unavailable.');
                }
            } catch (err) {
                console.error('[CreateCommunity] Error:', err);
                window.toast(`⚠️ Error: ${err.message}`);
            }
        }
    }
};

window.prevStep = function() {
    if (currentStep > 1) window.goStep(currentStep - 1);
};

// ==========================================
// 3. LIVE PREVIEW & INPUTS
// ==========================================

window.updatePreview = function() {
    const nameInput = document.getElementById('comm-name');
    const val = nameInput.value;
    
    document.getElementById('pc-name').textContent = val || 'Your Community';
    document.getElementById('name-len').textContent = val.length;
    
    // Sync to slug preview automatically if slug field is empty
    const slugPreview = document.getElementById('slug-preview');
    const slugInput = document.getElementById('comm-slug');
    
    if (!slugInput.value) {
        slugPreview.textContent = generateSlug(val);
    }
};

window.updateDesc = function() {
    const desc = document.getElementById('comm-desc').value;
    document.getElementById('desc-len').textContent = desc.length;
};

window.slugify = function() {
    const val = document.getElementById('comm-slug').value;
    document.getElementById('slug-preview').textContent = generateSlug(val);
};

function generateSlug(str) {
    return str.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
        .replace(/^-+|-+$/g, '')    // Trim hyphens from ends
        || 'your-community';
}

// ==========================================
// 4. APPEARANCE & CATEGORY
// ==========================================

window.pickCat = function(el, catName) {
    document.querySelectorAll('.cat-item').forEach(c => c.classList.remove('on'));
    el.classList.add('on');
    document.getElementById('pc-meta').textContent = `${catName} · 0 members`;
};

window.setIcon = function(el, emoji) {
    const previewIcon = document.getElementById('pc-ico');
    if (previewIcon) previewIcon.textContent = emoji;
    window.toast(`Icon updated to ${emoji}`);
};

window.pickBanner = function(el) {
    document.querySelectorAll('.bp-item').forEach(b => b.classList.remove('on'));
    el.classList.add('on');
    
    // Update Preview Banner Background
    const previewBanner = document.querySelector('.pc-banner');
    const computedStyle = window.getComputedStyle(el);
    if (previewBanner) {
        previewBanner.style.background = computedStyle.background;
    }
};

window.pickPrivacy = function(el, visibility) {
    const grid = el.closest('.role-grid');
    grid.querySelectorAll('.role-card').forEach(card => {
        card.classList.remove('on');
        const badge = card.querySelector('.rc-badge');
        if (badge) badge.remove();
    });

    el.classList.add('on');
    const topSection = el.querySelector('.rc-top');
    const selectedBadge = document.createElement('span');
    selectedBadge.className = 'rc-badge';
    selectedBadge.textContent = 'Selected';
    topSection.appendChild(selectedBadge);

    // Falls back to inferring from the card's own label text if no explicit
    // value was passed in from the onclick (keeps this working either way).
    selectedVisibility = visibility
        || (el.textContent.toLowerCase().includes('private') ? 'private' : 'public');
};

// ==========================================
// 5. CHANNEL BUILDER
// ==========================================

window.showChForm = function() {
    document.getElementById('ch-form').classList.add('on');
    document.getElementById('add-ch-btn').style.display = 'none';
};

window.cancelCh = function() {
    document.getElementById('ch-form').classList.remove('on');
    document.getElementById('add-ch-btn').style.display = 'flex';
};

window.addCh = function() {
    const nameInput = document.getElementById('new-ch-name');
    const descInput = document.getElementById('new-ch-desc');
    
    if (window.NexusValidator) {
        const valid = window.NexusValidator.validateForm([
            { element: nameInput, validators: [{ check: v => window.NexusValidator.isRequired(v), message: 'Channel name is required' }] },
            { element: descInput, validators: [{ check: v => window.NexusValidator.isRequired(v), message: 'Channel description is required' }] }
        ]);
        if (!valid) {
            window.toast('⚠️ Please fill out all required fields.');
            return;
        }
    } else {
        if (!nameInput.value.trim() || !descInput.value.trim()) {
            window.toast('⚠️ Channel name and description are required');
            return;
        }
    }

    const name = nameInput.value.trim();
    const desc = descInput.value.trim();

    const slug = generateSlug(name);
    const channelList = document.getElementById('ch-list');
    
    const newChannel = document.createElement('div');
    newChannel.className = 'ch-item';
    newChannel.innerHTML = `
        <div class="ch-ico">💬</div>
        <div class="ch-info">
            <div class="ch-name">#${slug}</div>
            <div class="ch-desc">${desc || 'No description provided'}</div>
        </div>
        <span class="ch-type">Text</span>
        <span class="ch-del" onclick="delCh(this)">✕</span>
    `;

    channelList.appendChild(newChannel);
    
    // Clear & Close
    nameInput.value = '';
    descInput.value = '';
    window.cancelCh();
    window.toast(`✅ Channel #${slug} added to draft`);
};

window.delCh = function(el) {
    el.closest('.ch-item').remove();
    window.toast('Channel removed from list');
};

window.setChType = function(el) {
    el.closest('.ch-type-picker').querySelectorAll('.ctp').forEach(c => c.classList.remove('on'));
    el.classList.add('on');
};

// ==========================================
// 6. UTILITIES & INIT
// ==========================================

window.toast = function(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => el.classList.remove('show'), 2600);
};

document.addEventListener('DOMContentLoaded', () => {
    // Initialize first step
    window.goStep(1);
    console.log("Community Creator Initialized.");
});
