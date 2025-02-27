var express = require('express');
var router = express.Router();
const multer = require('multer');
const tanamanController = require('../controllers/plantController');
const authController = require('../controllers/authController');
const upload = require('../middlewares/upload');
const auth = require('../middlewares/auth');

router.get('/add', auth.ensureAuth, (req,res) => {
  res.render('addQR')
});

router.get('/', auth.ensureAuth, tanamanController.getAllTanaman);

router.get('/kelola', auth.ensureAuth, tanamanController.getAllTanaman);

router.post('/submit', auth.ensureAuth, upload.single('foto'), tanamanController.createTanaman);

// Rute untuk menampilkan halaman detail tanaman
router.get('/detail/:id', tanamanController.getTanamanDetail);
router.post('/edit/:id', auth.ensureAuth, upload.single('foto'), tanamanController.updateTanaman);
router.delete('/hapus/:id', auth.ensureAuth, tanamanController.deleteTanaman);
router.get('/download-all-qrcodes', auth.ensureAuth, tanamanController.downloadAllQRCodes);

router.use((req, res, next) => {
  res.locals.messages = {
      success: req.flash('success'),
      error: req.flash('error'),
  };
  next();
});
module.exports = router;