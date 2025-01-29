const { tanaman: TanamanModel } = require('../models');
const fs = require('fs');
const QRCode = require('qrcode');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const archiver = require('archiver');
const { Op } = require('sequelize');

class TanamanController {
    static async createTanaman(req, res) {
        try {
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
    
            // Buat canvas untuk menggabungkan teks dan QR code
            const canvas = createCanvas(400, 400);
            const ctx = canvas.getContext('2d');
    
            // Set background putih
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 400, 400);
    
            // Tambahkan nama tanaman
            ctx.fillStyle = 'black';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(nama, 200, 40);
    
            // Generate dan gambar QR code
            const qrCodeImage = await QRCode.toBuffer(detailUrl);
            const qrImage = await loadImage(qrCodeImage);
            ctx.drawImage(qrImage, 50, 80, 300, 300);
    
            // Simpan gambar gabungan
            const qrCodePath = path.join(qrCodeDir, `${newTanaman.id}.png`);
            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync(qrCodePath, buffer);
    
            // Update data tanaman dengan path QR code
            newTanaman.qrcode = `/qrcodes/${newTanaman.id}.png`;
            await newTanaman.save();
    
            res.json({ 
                success: true, 
                qrcode: newTanaman.qrcode,
                nama: nama.replace(/[^a-z0-9]/gi, '_').toLowerCase() // Nama file yang aman
            });
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
        const limit = 10;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        // Buat kondisi pencarian
        const where = {};
        if (search) {
            where.nama = {
                [Op.like]: `%${search}%`
            };
        }

        // Ambil total count dan data yang sudah dipaginasi
        const { count, rows } = await TanamanModel.findAndCountAll({
            where,
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
            totalPages: totalPages,
            search: search // Kirim nilai search ke view
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

static async updateTanaman(req, res) {
    try {
        const id = req.params.id;
        const { nama, lokasi, deskripsi } = req.body;
        
        const tanaman = await TanamanModel.findByPk(id);
        if (!tanaman) {
            return res.status(404).json({ 
                success: false,
                message: 'Tanaman tidak ditemukan' 
            });
        }
        
        // Siapkan data untuk update
        let updateData = {
            nama,
            lokasi,
            deskripsi
        };

        // Jika ada file foto baru yang diupload
        if (req.file) {
            // Hapus foto lama jika ada
            if (tanaman.foto) {
                const oldPhotoPath = path.join(__dirname, '../public/', tanaman.foto);
                if (fs.existsSync(oldPhotoPath)) {
                    fs.unlinkSync(oldPhotoPath);
                }
            }
            // Simpan path foto baru
            updateData.foto = `/uploads/${req.file.filename}`;
        }
        
        // Update data tanaman
        await tanaman.update(updateData);
        
        res.json({ 
            success: true,
            message: 'Tanaman berhasil diupdate'
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan saat mengupdate tanaman' 
        });
    }
}

// Update delete method to match frontend expectations
static async deleteTanaman(req, res) {
    try {
        const id = req.params.id;
        const tanaman = await TanamanModel.findByPk(id);
        
        if (!tanaman) {
            return res.status(404).json({ 
                success: false,
                message: 'Tanaman tidak ditemukan' 
            });
        }
        
        // Hapus foto jika ada
        if (tanaman.foto) {
            const photoPath = path.join(__dirname, '../public/', tanaman.foto);
            if (fs.existsSync(photoPath)) {
                fs.unlinkSync(photoPath);
            }
        }
        
        await tanaman.destroy();
        res.json({ 
            success: true,
            message: 'Tanaman berhasil dihapus' 
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan saat menghapus tanaman' 
        });
    }
}

static async downloadAllQRCodes(req, res) {
    try {
        const archive = archiver('zip', {
            zlib: { level: 9 } // Kompresi maksimum
        });
        
        // Set header untuk download
        res.attachment('semua_qrcode.zip');
        archive.pipe(res);
        
        // Ambil semua data tanaman
        const tanaman = await TanamanModel.findAll();
        
        // Tambahkan semua file QR code ke dalam zip
        for (const item of tanaman) {
            const qrPath = path.join(__dirname, '../public', item.qrcode);
            if (fs.existsSync(qrPath)) {
                archive.file(qrPath, { 
                    name: `${item.nama.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_qr.png`
                });
            }
        }
        
        await archive.finalize();
    } catch (error) {
        console.error('Error creating zip:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Gagal mengunduh QR Codes' 
        });
    }
}
}

module.exports = TanamanController;
