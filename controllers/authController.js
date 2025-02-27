const {Admin} = require('../models');
const bcrypt = require('bcrypt');

module.exports = {
  // Handle login logic
  postLogin: async (req, res) => {
    try {
        const admin = await Admin.findOne({ where: { username: req.body.username } });
        
        // Check if admin exists
        if (!admin) {
            console.log('Login failed: Admin not found');
            req.flash('error', { msg: 'username atau password salah' });
            return res.redirect('/auth/login');
        }

        // Check password
        if (await bcrypt.compare(req.body.password, admin.password)) {
            console.log('Login successful for:', admin.username);
            
            // Save data to session
            req.session.user = {
                id: admin.id,
                username: admin.username
            };
            req.session.save();
            console.log('Session after login:', req.session);
            return res.redirect('/');
        }
        
        console.log('Login failed: Invalid password');
        req.flash('error', { msg: 'Username atau password salah' });
        res.redirect('/auth/login');
    } catch (error) {
        console.error('Login error:', error);
        req.flash('error', { msg: 'Terjadi kesalahan saat login' });
        res.redirect('/auth/login');
    }
  },

  logout: async (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ success: false, message: 'Error logging out' });
        }
        res.redirect('/auth/login'); // Redirect to login page
    });
  }
};