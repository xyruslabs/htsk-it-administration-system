import { Router } from 'express';
import {
  getLeaveBalances,
  getLeaveRequests,
  submitLeaveRequest,
  reviewLeaveRequest
} from '../controllers/leaveController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/balances', getLeaveBalances);
router.get('/requests', getLeaveRequests);
router.post('/apply', submitLeaveRequest);

// Approvals handled by Manager, HR, Admin
router.put('/review/:id', authorize('ADMIN', 'HR', 'MANAGER'), reviewLeaveRequest);

export default router;
