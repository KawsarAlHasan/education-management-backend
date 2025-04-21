const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const storage = multer.diskStorage({
  destination: "public/files",
  filename: function (req, file, cb) {
    const uniqueId = crypto.randomUUID();

    const cleanFileName = file.originalname.replace(/\s+/g, "-");
    const ext = path.extname(cleanFileName);
    const baseName = path.basename(cleanFileName, ext);

    const maxFileNameLength = 54 - (uniqueId.length + 1 + ext.length);

    const shortBaseName =
      baseName.length > maxFileNameLength
        ? baseName.substring(0, maxFileNameLength)
        : baseName;

    const uniqueSuffix =
      Date.now().toString(36).substr(-2) +
      Math.random().toString(36).substr(2, 3);

    const finalName = `${shortBaseName}${uniqueId}-${uniqueSuffix}${ext}`;
    cb(null, finalName);
  },
});

const uploadFile = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

module.exports = uploadFile;
