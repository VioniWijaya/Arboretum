var express = require('express');
var router = express.Router();
const multer = require('multer');
const tanamanController = require('../controllers/plantController');
const upload = multer({ dest: 'public/uploads/' });

router.get('/add', (req,res) => {
  res.render('addQR')
});
router.post('/submit', upload.single('foto'), tanamanController.submitTanaman);
router.get('/list', tanamanController.getAllTanaman);

router.get('/kelola', tanamanController.getAllTanaman);

router.get('/detail', (req,res) => {
  res.render('viewQR')
});

module.exports = router;