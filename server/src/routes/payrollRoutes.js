import { Router } from 'express';
import {
  generateMonthlyPayroll,
  getPayrolls,
  updatePayrollStatus
} from '../controllers/payrollController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// View payrolls (role-filtered in controller)
router.get('/', getPayrolls);

// Generate & status update restricted to Admin and HR
router.post('/generate', authorize('ADMIN', 'HR'), generateMonthlyPayroll);
router.put('/:id/status', authorize('ADMIN', 'HR'), updatePayrollStatus);

export default router;
