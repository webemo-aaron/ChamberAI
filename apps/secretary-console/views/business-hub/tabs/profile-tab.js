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
 * Exported function: initProfileTab(container, options)
 */

import { getCurrentRole } from "../../../core/auth.js";

/**
 * Initialize profile tab
 * @param {HTMLElement} container - Container to render into
 * @param {Object} options - Configuration options
 * @param {Object} options.business - Business data object
 */
export function initProfileTab(container, options = {}) {
  const { business = {} } = options;
  const role = getCurrentRole();
  const isAdmin = role === "admin";

  const html = `
    <div class="profile-tab-content">
      <!-- Description Section -->
      ${
        business.description
          ? `
        <section class="profile-section">
          <h3>About</h3>
          <p class="profile-description">${escapeHtml(business.description)}</p>
        </section>
      `
          : ""
      }

      <!-- Contact Information Section -->
      <section class="profile-section">
        <h3>Contact Information</h3>
        <div class="profile-contact">
          ${
            business.phone
              ? `
            <div class="contact-item">
              <span class="contact-label">Phone:</span>
              <a href="tel:${business.phone}" class="contact-link">
                ${escapeHtml(business.phone)}
              </a>
            </div>
          `
              : ""
          }

          ${
            business.email
              ? `
            <div class="contact-item">
              <span class="contact-label">Email:</span>
              <a href="mailto:${business.email}" class="contact-link">
                ${escapeHtml(business.email)}
              </a>
            </div>
          `
              : ""
          }

          ${
            business.website
              ? `
            <div class="contact-item">
              <span class="contact-label">Website:</span>
              <a href="${business.website}" target="_blank" rel="noopener noreferrer" class="contact-link">
                ${escapeHtml(business.website)}
              </a>
            </div>
          `
              : ""
          }

          ${
            business.address
              ? `
            <div class="contact-item">
              <span class="contact-label">Address:</span>
              <div class="address-block">
                <span>${escapeHtml(business.address)}</span>
                ${business.city ? `<span>${escapeHtml(business.city)}` : ""}
                ${business.state ? `, ${escapeHtml(business.state)}` : ""}
                ${business.zip ? ` ${escapeHtml(business.zip)}</span>` : "</span>"}
                <button class="btn-copy" id="copyAddressBtn" title="Copy address">
                  📋 Copy
                </button>
              </div>
            </div>
          `
              : ""
          }
        </div>
      </section>

      <!-- Hours Section -->
      ${
        business.hours
          ? `
        <section class="profile-section">
          <h3>Hours of Operation</h3>
          <div class="profile-hours">
            ${renderHours(business.hours)}
          </div>
        </section>
      `
          : ""
      }

      <!-- Rating Section -->
      ${
        business.rating !== undefined
          ? `
        <section class="profile-section">
          <h3>Rating</h3>
          <div class="profile-rating">
            <div class="rating-stars">
              ${Array(5)
                .fill(0)
                .map(
                  (_, i) =>
                    `<span class="star ${i < Math.floor(business.rating) ? "filled" : ""}">★</span>`
                )
                .join("")}
            </div>
            <span class="rating-value">${business.rating.toFixed(1)} / 5.0</span>
            ${business.reviewCount ? `<span class="rating-count">(${business.reviewCount} reviews)</span>` : ""}
          </div>
        </section>
      `
          : ""
      }

      <!-- Social Links Section -->
      ${
        business.socialLinks && Object.keys(business.socialLinks).length > 0
          ? `
        <section class="profile-section">
          <h3>Follow Us</h3>
          <div class="profile-social">
            ${Object.entries(business.socialLinks)
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
        ${isAdmin ? '<button class="btn ghost" id="editBtn">✏️ Edit Profile</button>' : ""}
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Attach event listeners
  const copyBtn = container.querySelector("#copyAddressBtn");
  const contactBtn = container.querySelector("#contactBtn");
  const editBtn = container.querySelector("#editBtn");

  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const address = `${business.address || ""} ${business.city || ""} ${business.state || ""} ${business.zip || ""}`.trim();
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
      if (business.email) {
        window.location.href = `mailto:${business.email}`;
      }
    });
  }

  if (editBtn) {
    editBtn.addEventListener("click", () => {
      // TODO: Implement edit functionality
      console.log("Edit profile clicked for:", business.id);
    });
  }
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
 * Escape HTML special characters
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
