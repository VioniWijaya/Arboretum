// middleware/auth.js
module.exports = {
    ensureAuth: (req, res, next) => {
        console.log('ensureAuth middleware called');
        console.log('Session:', req.session);
        console.log('Session ID:', req.session.id);
        console.log('User in session:', req.session.user);
        
        if (req.session && req.session.user) {
            return next();
        }
        console.log('Authentication failed - redirecting to login');
        req.flash('error', { msg: 'Silakan login terlebih dahulu' });
        res.redirect('/auth/login');
    },
    
    checkRole: (roles) => {
        return (req, res, next) => {
            console.log('checkRole middleware called');
            console.log('Required roles:', roles);
            console.log('User role:', req.session.user?.role);
            
            if (!req.session.user || !roles.includes(req.session.user.role)) {
                console.log('Role check failed');
                req.flash('error', { msg: 'Anda tidak memiliki akses' });
                return res.redirect('/auth/login');
            }
            console.log('Role check passed');
            next();
        };
    }
  };