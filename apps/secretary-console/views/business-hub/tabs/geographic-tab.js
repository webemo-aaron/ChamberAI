/**
 * Geographic Tab Component
 *
 * Displays location and geographic information:
 * - Location/address information
 * - Service area details
 * - Map display (embedded or directions link)
 * - Geographic scope (city, county, etc.)
 * - Coordinates for mapping
 *
 * Exported function: initGeographicTab(container, options)
 */

/**
 * Initialize geographic tab
 * @param {HTMLElement} container - Container to render into
 * @param {Object} options - Configuration options
 * @param {Object} options.business - Business data object
 */
export function initGeographicTab(container, options = {}) {
  const { business = {} } = options;

  const html = `
    <div class="geographic-tab-content">
      <!-- Primary Location Section -->
      ${
        business.address
          ? `
        <section class="geo-section">
          <h3>Primary Location</h3>
          <div class="geo-location">
            <p class="location-address">${escapeHtml(business.address)}</p>
            <div class="location-details">
              ${business.city ? `<span class="location-city">${escapeHtml(business.city)}</span>` : ""}
              ${business.state ? `<span class="location-state">${escapeHtml(business.state)}</span>` : ""}
              ${business.zip ? `<span class="location-zip">${escapeHtml(business.zip)}</span>` : ""}
            </div>
            <div class="location-actions">
              ${
                business.lat && business.lng
                  ? `
                <a href="https://maps.google.com/?q=${business.lat},${business.lng}"
                   target="_blank"
                   rel="noopener noreferrer"
                   class="btn ghost"
                   title="View on Google Maps"
                >
                  🗺️ View on Maps
                </a>
              `
                  : ""
              }
              ${
                business.address
                  ? `
                <a href="https://maps.google.com/maps/search/${encodeURIComponent(
                    business.address
                  )}"
                   target="_blank"
                   rel="noopener noreferrer"
                   class="btn ghost"
                   title="Get directions"
                >
                  📍 Get Directions
                </a>
              `
                  : ""
              }
            </div>
          </div>
        </section>
      `
          : ""
      }

      <!-- Service Area Section -->
      ${
        business.serviceArea
          ? `
        <section class="geo-section">
          <h3>Service Area</h3>
          <div class="service-area">
            <p>${escapeHtml(business.serviceArea)}</p>
          </div>
        </section>
      `
          : ""
      }

      <!-- Geographic Scope Section -->
      ${
        business.geoScopeType
          ? `
        <section class="geo-section">
          <h3>Coverage Area</h3>
          <div class="geo-scope">
            <div class="scope-item">
              <span class="scope-label">Scope Type:</span>
              <span class="scope-value">${escapeHtml(business.geoScopeType)}</span>
            </div>
            ${
              business.geoScopeId
                ? `
              <div class="scope-item">
                <span class="scope-label">Scope ID:</span>
                <span class="scope-value">${escapeHtml(business.geoScopeId)}</span>
              </div>
            `
                : ""
            }
          </div>
        </section>
      `
          : ""
      }

      <!-- Coordinates Section -->
      ${
        business.lat && business.lng
          ? `
        <section class="geo-section">
          <h3>Coordinates</h3>
          <div class="geo-coordinates">
            <div class="coord-item">
              <span class="coord-label">Latitude:</span>
              <span class="coord-value">${formatCoordinate(business.lat)}</span>
            </div>
            <div class="coord-item">
              <span class="coord-label">Longitude:</span>
              <span class="coord-value">${formatCoordinate(business.lng)}</span>
            </div>
          </div>
        </section>
      `
          : ""
      }

      <!-- Map Embed -->
      ${
        business.lat && business.lng
          ? `
        <section class="geo-section">
          <h3>Map</h3>
          <div class="geo-map-container">
            <iframe
              class="geo-map-embed"
              src="https://www.google.com/maps/embed/v1/place?key=AIzaSyDummyKeyForDemo&q=${business.lat},${business.lng}"
              allowfullscreen=""
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
              title="Location map"
              aria-label="Location map"
            ></iframe>
          </div>
        </section>
      `
          : ""
      }

      <!-- Additional Geographic Info -->
      ${
        business.region
          ? `
        <section class="geo-section">
          <h3>Regional Information</h3>
          <div class="geo-region">
            <p>${escapeHtml(business.region)}</p>
          </div>
        </section>
      `
          : ""
      }
    </div>
  `;

  container.innerHTML = html;
}

/**
 * Format coordinate to reasonable decimal places
 */
function formatCoordinate(coord) {
  return typeof coord === "number" ? coord.toFixed(4) : String(coord);
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
