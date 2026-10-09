import { Router } from 'express';
import {
  getTodayAttendanceStatus,
  clockIn,
  clockOut,
  startBreak,
  endBreak,
  getAttendanceHistory,
  getLiveFloorMonitor
} from '../controllers/attendanceController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Quick employee actions
router.get('/today', getTodayAttendanceStatus);
router.post('/clock-in', clockIn);
router.post('/clock-out', clockOut);
router.post('/break/start', startBreak);
router.post('/break/end', endBreak);

// History logs
router.get('/history', getAttendanceHistory);

// Live Floor monitor for team leads, HR, and admins
router.get('/live-floor', getLiveFloorMonitor);

export default router;
