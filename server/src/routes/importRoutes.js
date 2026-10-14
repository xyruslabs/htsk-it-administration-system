import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth.js';
import { previewImport, confirmImport } from '../controllers/importController.js';

const router = Router();

// Store file in memory (no disk writes needed — we parse buffer directly)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel',                                           // .xls
      'application/octet-stream'
    ];
    const ext = file.originalname.split('.').pop().toLowerCase();
    if (allowed.includes(file.mimetype) || ext === 'xlsx' || ext === 'xls') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed.'));
    }
  }
});

router.use(authenticate);

// HR/Admin only — preview parsed Excel before confirming
router.post('/preview', authorize('ADMIN', 'HR'), upload.single('file'), previewImport);

// HR/Admin only — execute the import
router.post('/confirm', authorize('ADMIN', 'HR'), confirmImport);

export default router;
