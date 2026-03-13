const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const uploadsRoot = path.join(__dirname, '../../uploads');
const avatarDir = path.join(uploadsRoot, 'avatars');
const coverDir = path.join(uploadsRoot, 'covers');

const ensureUploadDirectories = () => {
  [uploadsRoot, avatarDir, coverDir].forEach((directory) => {
    fs.mkdirSync(directory, { recursive: true });
  });
};

const createStorage = (subdirectory) => multer.diskStorage({
  destination: (req, file, callback) => {
    ensureUploadDirectories();
    callback(null, path.join(uploadsRoot, subdirectory));
  },
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    callback(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
  },
});

const imageFileFilter = (req, file, callback) => {
  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    return callback(new Error('Seuls les fichiers image sont autorisés.'));
  }

  callback(null, true);
};

const createUploader = (subdirectory) => multer({
  storage: createStorage(subdirectory),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const createSingleUploadMiddleware = (uploader, fieldName) => (req, res, next) => {
  uploader.single(fieldName)(req, res, (error) => {
    if (!error) {
      return next();
    }

    const message = error.code === 'LIMIT_FILE_SIZE'
      ? 'Le fichier est trop volumineux (max. 5 MB).'
      : error.message || 'Erreur lors de l’upload du fichier.';

    return res.status(400).json({ message });
  });
};

const buildPublicUploadPath = (subdirectory, filename) => `/uploads/${subdirectory}/${filename}`;

const getPublicPathFromFile = (file, subdirectory) => {
  if (!file || !file.filename) {
    return null;
  }

  return buildPublicUploadPath(subdirectory, file.filename);
};

const removeUploadedFile = async (publicPath) => {
  if (!publicPath || typeof publicPath !== 'string' || !publicPath.startsWith('/uploads/')) {
    return;
  }

  const relativePath = publicPath.replace(/^\/+/, '').split('/').join(path.sep);
  const absolutePath = path.join(__dirname, '../..', relativePath);

  try {
    await fs.promises.unlink(absolutePath);
  } catch {
    // Ignoré si le fichier n'existe plus.
  }
};

const avatarUpload = createUploader('avatars');
const coverUpload = createUploader('covers');

module.exports = {
  ensureUploadDirectories,
  avatarUploadMiddleware: createSingleUploadMiddleware(avatarUpload, 'avatar'),
  coverUploadMiddleware: createSingleUploadMiddleware(coverUpload, 'cover'),
  getAvatarPublicPath: (file) => getPublicPathFromFile(file, 'avatars'),
  getCoverPublicPath: (file) => getPublicPathFromFile(file, 'covers'),
  removeUploadedFile,
};
