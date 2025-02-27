const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');


// Rute untuk login
router.get('/login',  (req, res) => {
  res.render('login',  { messages: req.flash() });
});

router.post('/login', authController.postLogin);


router.post('/logout', authController.logout);

module.exports = router;