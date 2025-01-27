var express = require('express');
var router = express.Router();
const multer = require('multer');
const tanamanController = require('../controllers/plantController');
const upload = require('../middlewares/upload');

router.get('/add', (req,res) => {
  res.render('addQR')
});
// router.post('/submit', upload.single('foto'), tanamanController.submitTanaman);
router.get('/', tanamanController.getAllTanaman);

router.get('/kelola', tanamanController.getAllTanaman);
// router.get('/tanaman/hapus/:id', tanamanController.deleteTanaman);
// Rute untuk menambah tanaman dan membuat QR code
router.post('/submit', upload.single('foto'), tanamanController.createTanaman);

// Rute untuk menampilkan halaman detail tanaman
router.get('/detail/:id', tanamanController.getTanamanDetail);
router.post('/tanaman/edit/:id', tanamanController.updateTanaman);
router.delete('/tanaman/hapus/:id', tanamanController.deleteTanaman);
// router.get('/detail', tanamanController.getEachTanaman);
router.use((req, res, next) => {
  res.locals.messages = {
      success: req.flash('success'),
      error: req.flash('error'),
  };
  next();
});
module.exports = router;