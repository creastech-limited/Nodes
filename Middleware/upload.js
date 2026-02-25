const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const {regUser} = require('../Models/registeration'); // Adjust the path as necessary

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/');
//   },
//   filename: function (req, file, cb) {
//     const ext = path.extname(file.originalname);
//     cb(null, `${Date.now()}-${file.fieldname}${ext}`);
//   }
// });

// const fileFilter = (req, file, cb) => {
//   const allowedTypes = /jpeg|jpg|png/;
//   const isValid = allowedTypes.test(file.mimetype);
//   cb(isValid ? null : new Error('Invalid file type'), isValid);
// };

// module.exports = multer({ storage, fileFilter });




// Use memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const isValid = allowedTypes.test(file.mimetype);
  cb(isValid ? null : new Error('Invalid file type'), isValid);
};

// Multer middleware for uploading to memory
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

// Image compression middleware using sharp
const compressAndSaveProfilePicture = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId || !req.file) {
      return res.status(400).json({ message: 'userId and file are required' });
    }
    //get user from database
    const user = await regUser.findById(userId);
    const userName = user.name.replace(/\s+/g, '_'); // Replace spaces with underscores for file name
    console.log('User Name:', userName);

    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }

    const fileName = `user_${user.firstName}.jpg`;
    const filePath = path.join(uploadsDir, fileName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath); // Remove existing file
    }

    await sharp(req.file.buffer)
      .resize(300, 300)
      .jpeg({ quality: 80 })
      .toFile(filePath);

    req.savedFilePath = `/uploads/${fileName}`;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadProfileImage: upload.single('profile'),
  compressAndSaveProfilePicture
};
