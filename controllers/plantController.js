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
    
            // Buat QR Code dengan opsi untuk logo
            const qrCodeBuffer = await QRCode.toBuffer(detailUrl, {
                errorCorrectionLevel: 'H',
                margin: 2,
                width: 400,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            });
    
            // Buat canvas yang lebih tinggi untuk mengakomodasi nama
            const canvasWidth = 400;
            const canvasHeight = 480; // Tinggi ditambah untuk ruang nama
            const canvas = createCanvas(canvasWidth, canvasHeight);
            const ctx = canvas.getContext('2d');
    
            // Set background putih untuk seluruh canvas
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
            // Tambahkan nama tanaman di atas
            ctx.fillStyle = 'black';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(nama, canvasWidth / 2, 60); // Posisi teks di atas
    
            // Load dan gambar QR code
            const qrImage = await loadImage(qrCodeBuffer);
            ctx.drawImage(qrImage, 0, 80, canvasWidth, canvasWidth); // Mulai gambar QR dari y=80
    
            // Load dan gambar logo
            const logoPath = path.join(__dirname, '../public/sumbar.png');
            const logoImage = await loadImage(logoPath);
            
            // Hitung ukuran dan posisi logo (30% dari ukuran QR)
            const logoSize = canvasWidth * 0.3;
            const logoX = (canvasWidth - logoSize) / 2;
            const logoY = ((canvasWidth - logoSize) / 2) + 80; // Sesuaikan dengan posisi QR
            
            // Gambar logo
            ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
    
            // Simpan hasil akhir
            const qrCodePath = path.join(qrCodeDir, `${newTanaman.id}.png`);
            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync(qrCodePath, buffer);
    
            // Update data tanaman dengan path QR code
            newTanaman.qrcode = `/qrcodes/${newTanaman.id}.png`;
            await newTanaman.save();
    
            res.json({ 
                success: true, 
                qrcode: newTanaman.qrcode,
                nama: nama.replace(/[^a-z0-9]/gi, '_').toLowerCase()
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
        const AdmZip = require('adm-zip');
        const zip = new AdmZip();
        const qrCodeDir = path.join(__dirname, '../public/qrcodes');

        // Get all tanaman records
        const allTanaman = await TanamanModel.findAll();

        // Add each QR code to the ZIP file
        for (const tanaman of allTanaman) {
            const qrCodePath = path.join(qrCodeDir, `${tanaman.id}.png`);
            if (fs.existsSync(qrCodePath)) {
                const safeFileName = `${tanaman.nama.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_qr.png`;
                zip.addLocalFile(qrCodePath, '', safeFileName);
            }
        }

        // Set response headers
        res.set('Content-Type', 'application/zip');
        res.set('Content-Disposition', `attachment; filename=semua_qrcode.zip`);
        
        // Send the zip file
        res.send(zip.toBuffer());

    } catch (error) {
        console.error('Error creating ZIP:', error);
        res.status(500).json({ success: false, message: 'Gagal mengunduh QR Codes' });
    }
}
}

module.exports = TanamanController;
