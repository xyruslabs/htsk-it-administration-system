import { Router } from 'express';
import {
  getAuditLogs,
  getSystemStats,
  getHrSetup,
  updateHrSetup
} from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'HR'));

router.get('/audit-logs', getAuditLogs);
router.get('/system-stats', getSystemStats);
router.get('/hr-setup', getHrSetup);
router.put('/hr-setup', updateHrSetup);

export default router;

