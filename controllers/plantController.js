const { tanaman: TanamanModel } = require('../models'); // Pastikan path relatif benar
const QRCode = require('qrcode');

// Controller untuk submit tanaman
exports.submitTanaman = async (req, res) => {
  try {
    const { nama, lokasi, deskripsi } = req.body;

    if (!nama || !lokasi || !deskripsi) {
      return res.status(400).json({ success: false, message: 'Semua field wajib diisi.' });
    }

    // Generate QR Code dengan data JSON
    const qrData = JSON.stringify({ nama, lokasi, deskripsi });
    const qrCodeUrl = await QRCode.toDataURL(qrData);

    // Simpan data ke database
    const tanaman = await TanamanModel.create({
      nama,
      lokasi,
      deskripsi,
      qrcode: qrCodeUrl,
    });

    // Kirim response dengan data QR Code
    res.status(200).json({ success: true, qrcode: tanaman.qrcode });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan.' });
  }
};

exports.getAllTanaman = async (req, res) => {
  try {
    // Ambil semua data tanaman dari database
    const tanaman = await TanamanModel.findAll();
    const view = req.path === '/kelola' ? 'kelolaQR' : 'listQR';
    
    res.render(view, { 
      tanaman: tanaman,
      totalTanaman: tanaman.length 
    });
  } catch (error) {
    console.error('Error fetching tanaman:', error);
    res.status(500).send('Terjadi kesalahan saat mengambil data');
  }
};
