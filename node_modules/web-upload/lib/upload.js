const multer = require('multer');

function Upload() {
  // type of images
  const mimeType = ['image/jpeg', 'image/png', 'image/svg+xml'];

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './images/');
    },
    filename: function (req, file, cb) {
      cb(null, new Date().toISOString() + file.originalname);
    }
  });

  const fileFilter = (req, file, cb) => {
    // reject a file
    if (mimeType.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  };

  const uploadImagesConfig = multer({
    storage: storage,
    limits: {
      fileSize: 1024 * 1024 * 5
    },
    fileFilter: fileFilter
  });

  this.uploadImages = function () {
    return uploadImagesConfig;
  }
};


module.exports = new Upload();







