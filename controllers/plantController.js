const { tanaman: TanamanModel } = require('../models');
const fs = require('fs');
const QRCode = require('qrcode');
const path = require('path');

class TanamanController {
    static async createTanaman(req, res) {
        try {
          // Pastikan folder qrcodes ada
          const qrCodeDir = path.join(__dirname, '../public/qrcodes');
          if (!fs.existsSync(qrCodeDir)) {
            fs.mkdirSync(qrCodeDir, { recursive: true });
          }
    
          const { nama, lokasi, deskripsi } = req.body;
          const foto = req.file ? `/uploads/${req.file.filename}` : null;
    
          // Simpan data tanaman ke database
          const newTanaman = await TanamanModel.create({ nama, lokasi, deskripsi, foto });
    
          // URL halaman detail
          const detailUrl = `${req.protocol}://${req.get('host')}/detail/${newTanaman.id}`;
    
          // Generate QR code
          const qrCodePath = path.join(qrCodeDir, `${newTanaman.id}.png`);
          await QRCode.toFile(qrCodePath, detailUrl);
    
          // Update data tanaman dengan path QR code
          newTanaman.qrcode = `/qrcodes/${newTanaman.id}.png`;
          await newTanaman.save();
    
          res.json({ success: true, qrcode: newTanaman.qrcode });
        } catch (error) {
          console.error(error);
          res.status(500).json({ success: false, message: 'Terjadi kesalahan.' });
        }
    }

  static async getTanamanDetail(req, res) {
    try {
      const tanaman = await TanamanModel.findByPk(req.params.id);
      if (!tanaman) {
        return res.status(404).send('Data tidak ditemukan.');
      }

      res.render('viewQR', { tanaman });
    } catch (error) {
      console.error(error);
      res.status(500).send('Terjadi kesalahan.');
    }
  }
  
  static async getAllTanaman(req, res) {
    try {
        // Set limit per halaman
        const limit = 10; // Jumlah item per halaman
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;

        // Ambil total count dan data yang sudah dipaginasi
        const { count, rows } = await TanamanModel.findAndCountAll({
            limit: limit,
            offset: offset,
            order: [['id', 'ASC']]
        });

        // Hitung total halaman
        const totalPages = Math.ceil(count / limit);

        // Tambahkan nomor urut
        const tanamanDenganNomor = rows.map((item, index) => ({
            ...item.toJSON(),
            no: offset + index + 1
        }));

        // Tentukan view berdasarkan path
        const view = req.path === '/kelola' ? 'kelolaQR' : 'listQR';
        
        res.render(view, { 
            tanaman: tanamanDenganNomor,
            totalTanaman: count,
            currentPage: page,
            totalPages: totalPages
        });
    } catch (error) {
        console.error('Error fetching tanaman:', error);
        res.status(500).send('Terjadi kesalahan saat mengambil data');
    }
}

// Menampilkan form edit
static async editForm(req, res) {
    try {
        const id = req.params.id;
        const tanaman = await TanamanModel.findByPk(id);
        
        if (!tanaman) {
            return res.status(404).send('Tanaman tidak ditemukan');
        }
        
        res.render('editTanaman', { tanaman });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Terjadi kesalahan saat mengambil data tanaman');
    }
}

// Update data tanaman
// Di TanamanController.js
static async updateTanaman(req, res) {
    try {
        const id = req.params.id;
        const { nama, lokasi, deskripsi } = req.body;
        
        const tanaman = await TanamanModel.findByPk(id);
        if (!tanaman) {
            return res.status(404).json({ message: 'Tanaman tidak ditemukan' });
        }
        
        await tanaman.update({
            nama,
            lokasi,
            deskripsi
        });
        
        res.json({ message: 'Tanaman berhasil diupdate' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Terjadi kesalahan saat mengupdate tanaman' });
    }
}

// Hapus tanaman
static async deleteTanaman(req, res) {
    try {
        const id = req.params.id;
        const tanaman = await TanamanModel.findByPk(id);
        
        if (!tanaman) {
            return res.status(404).json({ message: 'Tanaman tidak ditemukan' });
        }
        
        await tanaman.destroy();
        res.json({ message: 'Tanaman berhasil dihapus' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Terjadi kesalahan saat menghapus tanaman' });
    }
}

}

module.exports = TanamanController;
