/**
 * Profile Tab Component
 *
 * Displays business profile information:
 * - Business name and description
 * - Contact information (phone, email, website, address)
 * - Operating hours
 * - Social media links
 * - Contact/edit buttons
 * - Rating display
 *
 * Exported function: render(container, options)
 */

import { getCurrentRole } from "../../../core/auth.js";
import { request } from "../../../core/api.js";
import { showToast } from "../../../core/toast.js";
import { escapeHtml } from "../../common/format.js";

const LOCAL_DRAFT_KEY = "camBusinessProfileDrafts";

/**
 * Render profile tab
 * @param {HTMLElement} container - Container to render into
 * @param {Object} options - Configuration options
 * @param {Object} options.business - Business data object
 */
export function render(container, options = {}) {
  const { business = {}, onBusinessUpdated = () => {} } = options;
  const role = getCurrentRole();
  const isAdmin = role === "admin";
  let currentBusiness = applyDraftBusiness(business);
  let editMode = false;

  function renderView() {
    container.innerHTML = `
      <div class="profile-tab-content">
      <!-- Description Section -->
      ${
        currentBusiness.description
          ? `
        <section class="profile-section">
          <h3>About</h3>
          ${
            editMode
              ? `<textarea id="businessDescription" class="profile-edit-input profile-edit-textarea">${escapeHtml(
                  currentBusiness.description
                )}</textarea>`
              : `<p class="profile-description">${escapeHtml(currentBusiness.description)}</p>`
          }
        </section>
      `
          : ""
      }

      <!-- Contact Information Section -->
      <section class="profile-section">
        <h3>Contact Information</h3>
        <div class="profile-contact">
          ${
            currentBusiness.phone
              ? `
            <div class="contact-item">
              <span class="contact-label">Phone:</span>
              ${
                editMode
                  ? `<input id="businessPhone" class="profile-edit-input" type="tel" value="${escapeHtml(
                      currentBusiness.phone
                    )}" />`
                  : `<a href="tel:${currentBusiness.phone}" class="contact-link">
                      ${escapeHtml(currentBusiness.phone)}
                    </a>`
              }
            </div>
          `
              : ""
          }

          ${
            currentBusiness.email
              ? `
            <div class="contact-item">
              <span class="contact-label">Email:</span>
              ${
                editMode
                  ? `<input id="businessEmail" class="profile-edit-input" type="email" value="${escapeHtml(
                      currentBusiness.email
                    )}" />`
                  : `<a href="mailto:${currentBusiness.email}" class="contact-link">
                      ${escapeHtml(currentBusiness.email)}
                    </a>`
              }
            </div>
          `
              : ""
          }

          ${
            currentBusiness.website
              ? `
            <div class="contact-item">
              <span class="contact-label">Website:</span>
              ${
                editMode
                  ? `<input id="businessWebsite" class="profile-edit-input" type="url" value="${escapeHtml(
                      currentBusiness.website
                    )}" />`
                  : `<a href="${currentBusiness.website}" target="_blank" rel="noopener noreferrer" class="contact-link">
                      ${escapeHtml(currentBusiness.website)}
                    </a>`
              }
            </div>
          `
              : ""
          }

          ${
            currentBusiness.address
              ? `
            <div class="contact-item">
              <span class="contact-label">Address:</span>
              <div class="address-block">
                ${
                  editMode
                    ? `
                      <input id="businessAddress" class="profile-edit-input" type="text" value="${escapeHtml(
                        currentBusiness.address
                      )}" />
                      <div class="profile-edit-grid">
                        <input id="businessCity" class="profile-edit-input" type="text" value="${escapeHtml(
                          currentBusiness.city || ""
                        )}" placeholder="City" />
                        <input id="businessState" class="profile-edit-input" type="text" value="${escapeHtml(
                          currentBusiness.state || ""
                        )}" placeholder="State" />
                        <input id="businessZip" class="profile-edit-input" type="text" value="${escapeHtml(
                          currentBusiness.zip || ""
                        )}" placeholder="ZIP" />
                      </div>
                    `
                    : `
                      <span>${escapeHtml(currentBusiness.address)}</span>
                      ${currentBusiness.city ? `<span>${escapeHtml(currentBusiness.city)}` : ""}
                      ${currentBusiness.state ? `, ${escapeHtml(currentBusiness.state)}` : ""}
                      ${currentBusiness.zip ? ` ${escapeHtml(currentBusiness.zip)}</span>` : "</span>"}
                      <button class="btn-copy" id="copyAddressBtn" title="Copy address">
                        📋 Copy
                      </button>
                    `
                }
              </div>
            </div>
          `
              : ""
          }
        </div>
      </section>

      <!-- Hours Section -->
      ${
        currentBusiness.hours
          ? `
        <section class="profile-section">
          <h3>Hours of Operation</h3>
          <div class="profile-hours">
            ${renderHours(currentBusiness.hours)}
          </div>
        </section>
      `
          : ""
      }

      <!-- Rating Section -->
      ${
        currentBusiness.rating !== undefined
          ? `
        <section class="profile-section">
          <h3>Rating</h3>
          <div class="profile-rating">
            <div class="rating-stars">
              ${Array(5)
                .fill(0)
                .map(
                  (_, i) =>
                    `<span class="star ${i < Math.floor(currentBusiness.rating) ? "filled" : ""}">★</span>`
                )
                .join("")}
            </div>
            <span class="rating-value">${currentBusiness.rating.toFixed(1)} / 5.0</span>
            ${currentBusiness.reviewCount ? `<span class="rating-count">(${currentBusiness.reviewCount} reviews)</span>` : ""}
          </div>
        </section>
      `
          : ""
      }

      <!-- Social Links Section -->
      ${
        currentBusiness.socialLinks && Object.keys(currentBusiness.socialLinks).length > 0
          ? `
        <section class="profile-section">
          <h3>Follow Us</h3>
          <div class="profile-social">
            ${Object.entries(currentBusiness.socialLinks)
              .map(
                ([platform, url]) => `
              <a href="${url}" target="_blank" rel="noopener noreferrer" class="social-link" title="${platform}">
                ${getSocialIcon(platform)} ${capitalizeWord(platform)}
              </a>
            `
              )
              .join("")}
          </div>
        </section>
      `
          : ""
      }

      <!-- Action Buttons -->
      <div class="profile-actions">
        <button class="btn" id="contactBtn">📧 Send Message</button>
        ${
          isAdmin
            ? editMode
              ? '<button class="btn" id="saveProfileBtn">💾 Save Changes</button><button class="btn ghost" id="cancelEditBtn">Cancel</button>'
              : '<button class="btn ghost" id="editBtn">✏️ Edit Profile</button>'
            : ""
        }
      </div>
    </div>
  `;

    // Attach event listeners
    const copyBtn = container.querySelector("#copyAddressBtn");
    const contactBtn = container.querySelector("#contactBtn");
    const editBtn = container.querySelector("#editBtn");
    const saveBtn = container.querySelector("#saveProfileBtn");
    const cancelEditBtn = container.querySelector("#cancelEditBtn");

    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        const address = `${currentBusiness.address || ""} ${currentBusiness.city || ""} ${currentBusiness.state || ""} ${currentBusiness.zip || ""}`.trim();
        navigator.clipboard.writeText(address).then(() => {
          copyBtn.textContent = "✓ Copied!";
          setTimeout(() => {
            copyBtn.textContent = "📋 Copy";
          }, 2000);
        });
      });
    }

    if (contactBtn) {
      contactBtn.addEventListener("click", () => {
        if (currentBusiness.email) {
          window.location.href = `mailto:${currentBusiness.email}`;
        }
      });
    }

    if (editBtn) {
      editBtn.addEventListener("click", () => {
        editMode = true;
        renderView();
      });
    }

    if (cancelEditBtn) {
      cancelEditBtn.addEventListener("click", () => {
        editMode = false;
        renderView();
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener("click", async () => {
        const updatedBusiness = {
          ...currentBusiness,
          description: container.querySelector("#businessDescription")?.value ?? currentBusiness.description,
          phone: container.querySelector("#businessPhone")?.value ?? currentBusiness.phone,
          email: container.querySelector("#businessEmail")?.value ?? currentBusiness.email,
          website: container.querySelector("#businessWebsite")?.value ?? currentBusiness.website,
          address: container.querySelector("#businessAddress")?.value ?? currentBusiness.address,
          city: container.querySelector("#businessCity")?.value ?? currentBusiness.city,
          state: container.querySelector("#businessState")?.value ?? currentBusiness.state,
          zip: container.querySelector("#businessZip")?.value ?? currentBusiness.zip
        };

        const persistedBusiness = await persistBusinessDraft(updatedBusiness);
        currentBusiness = persistedBusiness;
        editMode = false;
        onBusinessUpdated(persistedBusiness);
        renderView();
      });
    }
  }

  renderView();
}

async function persistBusinessDraft(business) {
  try {
    const response = await request(`/business-listings/${business.id}`, "PUT", business, {
      suppressAlert: true
    });

    if (response && !response.error) {
      clearDraftBusiness(business.id);
      showToast("Business profile saved");
      return response.data || response;
    }
  } catch (error) {
    console.debug("[Business Profile] PUT unavailable:", error.message);
  }

  saveDraftBusiness(business);
  showToast("Business profile saved locally for this session");
  return business;
}

function applyDraftBusiness(business) {
  const drafts = JSON.parse(localStorage.getItem(LOCAL_DRAFT_KEY) || "{}");
  return drafts[business.id] ? { ...business, ...drafts[business.id] } : business;
}

function saveDraftBusiness(business) {
  const drafts = JSON.parse(localStorage.getItem(LOCAL_DRAFT_KEY) || "{}");
  drafts[business.id] = business;
  localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(drafts));
}

function clearDraftBusiness(businessId) {
  const drafts = JSON.parse(localStorage.getItem(LOCAL_DRAFT_KEY) || "{}");
  delete drafts[businessId];
  localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(drafts));
}

/**
 * Render hours of operation
 */
function renderHours(hours) {
  if (typeof hours === "string") {
    return `<p>${escapeHtml(hours)}</p>`;
  }

  if (typeof hours === "object") {
    return Object.entries(hours)
      .map(
        ([day, time]) => `
      <div class="hours-row">
        <span class="hours-day">${capitalizeWord(day)}:</span>
        <span class="hours-time">${escapeHtml(time)}</span>
      </div>
    `
      )
      .join("");
  }

  return "";
}

/**
 * Get social media icon
 */
function getSocialIcon(platform) {
  const icons = {
    facebook: "f",
    twitter: "𝕏",
    linkedin: "in",
    instagram: "📷",
    youtube: "▶️",
    website: "🌐"
  };
  return icons[platform.toLowerCase()] || "🔗";
}

/**
 * Capitalize first letter of word
 */
function capitalizeWord(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * Cleanup function — no-op for this tab
 * Called by business-detail.js on route change or business change.
 * @export
 */
export function cleanup() {
  // No document listeners, no open modals, no async state
}
