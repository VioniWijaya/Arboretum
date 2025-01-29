var express = require('express');
var router = express.Router();
const multer = require('multer');
const tanamanController = require('../controllers/plantController');
const upload = require('../middlewares/upload');

router.get('/add', (req,res) => {
  res.render('addQR')
});

router.get('/', tanamanController.getAllTanaman);

router.get('/kelola', tanamanController.getAllTanaman);

router.post('/submit', upload.single('foto'), tanamanController.createTanaman);

// Rute untuk menampilkan halaman detail tanaman
router.get('/detail/:id', tanamanController.getTanamanDetail);
router.post('/edit/:id', upload.single('foto'), tanamanController.updateTanaman);
router.delete('/hapus/:id', tanamanController.deleteTanaman);
router.get('/download-all-qrcodes', tanamanController.downloadAllQRCodes);

router.use((req, res, next) => {
  res.locals.messages = {
      success: req.flash('success'),
      error: req.flash('error'),
  };
  next();
});
module.exports = router;