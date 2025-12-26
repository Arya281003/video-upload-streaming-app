// Multi-tenant middleware to ensure users only access their own data
export const enforceTenantIsolation = (req, res, next) => {
  if (req.user) {
    // Ensure user can only access data from their organization
    req.tenantFilter = { organization: req.user.organization };
  }
  next();
};

