const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const storage = multer.diskStorage({
  destination: "public/images",
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

const uploadImage = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const supportedImage = /png|jpg|gif|svg|jpeg/;
    const extension = path.extname(file.originalname).toLowerCase();

    if (supportedImage.test(extension)) {
      cb(null, true);
    } else {
      cb(new Error("Must be png/jpg/jpeg/svg/gif image"));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

module.exports = uploadImage;
