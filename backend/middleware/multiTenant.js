// make sure users only see their own videos
export const enforceTenantIsolation = (req, res, next) => {
  if (req.user) {
    req.tenantFilter = { organization: req.user.organization };
  }
  next();
};

