const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');
const multer = require('multer');
const sharp = require('sharp');

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'products');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 4 },
  fileFilter(req, file, cb) {
    if (!/^image\/(jpeg|png|webp)$/i.test(file.mimetype || '')) return cb(new Error('Only JPG, PNG and WebP images are allowed.'));
    cb(null, true);
  },
});

async function saveImages(files = []) {
  await fs.mkdir(uploadDir, { recursive: true });
  const saved = [];
  try {
    for (const file of files) {
      const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.webp`;
      await sharp(file.buffer)
        .rotate()
        .resize({ width: 1600, height: 2000, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 84 })
        .toFile(path.join(uploadDir, name));
      saved.push(`/uploads/products/${name}`);
    }
    return saved;
  } catch (error) {
    await deleteImages(saved);
    throw error;
  }
}

async function deleteImages(paths = []) {
  for (const value of paths) {
    if (!String(value || '').startsWith('/uploads/products/')) continue;
    try {
      await fs.unlink(path.join(uploadDir, path.basename(value)));
    } catch (error) {
      if (error.code !== 'ENOENT') console.warn('Could not remove image:', error.message);
    }
  }
}

module.exports = { upload, saveImages, deleteImages };
