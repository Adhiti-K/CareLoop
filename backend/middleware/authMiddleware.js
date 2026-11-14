const { supabaseAdmin } = require('../config/supabase');
const { sendError } = require('../utils/responseHandler');

/**
 * Verifies Supabase Bearer token or mock developer token
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication token required', 401);
    }

    const token = authHeader.split(' ')[1];

    // Check mock dev token for testing if Supabase is offline
    if (token.startsWith('mock-token-')) {
      const mockRole = token.replace('mock-token-', '');
      req.user = {
        id: `mock-${mockRole}-uuid`,
        email: `${mockRole}@careloop.local`,
        role: mockRole,
        full_name: `Demo ${mockRole.charAt(0).toUpperCase() + mockRole.slice(1)}`
      };
      return next();
    }

    // Verify token with Supabase Auth
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return sendError(res, 'Invalid or expired session token', 401);
    }

    // Fetch verified profile from PostgreSQL
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileErr || !profile) {
      // Fallback if profile not yet completed
      req.user = {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || 'patient',
        full_name: user.user_metadata?.full_name || 'CareLoop User'
      };
    } else {
      req.user = profile;
    }

    if (req.user.status === 'suspended') {
      return sendError(res, 'Account is suspended. Please contact administrator.', 403);
    }

    next();
  } catch (err) {
    console.error('Auth Middleware Exception:', err);
    return sendError(res, 'Authentication failed', 401);
  }
}

module.exports = {
  authenticate
};
