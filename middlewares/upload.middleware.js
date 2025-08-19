import multer from "multer";
import path from "path";
import fs from "fs";

// 📂 Dossier des uploads
const uploadDir = path.resolve("uploads");

// Si le dossier n’existe pas → on le crée
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ⚙️ Configuration Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Nom unique → userId_timestamp.extension
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.id}_${Date.now()}${ext}`);
  },
});

// 🔎 Filtre pour accepter uniquement les images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Seules les images JPG, JPEG et PNG sont autorisées"), false);
  }
};

// Limite taille : 2 Mo max
const limits = { fileSize: 2 * 1024 * 1024 };

const upload = multer({ storage, fileFilter, limits });

export default upload;
