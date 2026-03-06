/**
 * Role-based access control middleware
 * Validates user has required role for the organization
 */

import { initFirestore } from "../db/firestore.js";
import { orgCollection } from "../db/orgFirestore.js";

/**
 * Require a specific role
 * @param {string} requiredRole - Required role (admin, secretary, viewer)
 * @returns {Function} Express middleware
 */
export function requireRole(requiredRole) {
  return async (req, res, next) => {
    try {
      // In test mode with mocked tokens, check mocked role
      if (req.user?.role) {
        if (req.user.role === requiredRole || req.user.role === "admin") {
          return next();
        }
        return res.status(403).json({
          error: `Insufficient permissions. Required: ${requiredRole}, Got: ${req.user.role}`
        });
      }

      // Check user role in membership
      const db = initFirestore();
      const userEmail = req.user?.email || req.headers["x-user-email"];

      if (!userEmail) {
        return res.status(401).json({ error: "User email not found" });
      }

      const membershipDoc = await orgCollection(db, req.orgId, "memberships")
        .doc(userEmail)
        .get();

      if (!membershipDoc.exists) {
        return res.status(403).json({ error: "User not member of organization" });
      }

      const membership = membershipDoc.data();
      const userRole = membership.role || "viewer";

      // Check if role is sufficient
      const roleHierarchy = {
        admin: 3,
        secretary: 2,
        viewer: 1
      };

      if ((roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 0)) {
        req.userRole = userRole;
        return next();
      }

      res.status(403).json({
        error: `Insufficient permissions. Required: ${requiredRole}, Got: ${userRole}`
      });
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Require admin role specifically
 */
export function requireAdmin(req, res, next) {
  return requireRole("admin")(req, res, next);
}

/**
 * Require secretary role or higher
 */
export function requireSecretary(req, res, next) {
  return requireRole("secretary")(req, res, next);
}

export default requireRole;
