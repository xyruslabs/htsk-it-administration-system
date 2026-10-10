import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  approveEmployee,
  rejectEmployee,
  getDepartments,
  createDepartment
} from '../controllers/employeeController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Directory access
router.get('/', getAllEmployees);
router.get('/departments', getDepartments);
router.get('/:id', getEmployeeById);

// Employee registration & profile update (accessible to all authenticated staff)
router.post('/', createEmployee);
router.put('/:id', updateEmployee);

// HR & Admin Approval workflows
router.put('/:id/approve', authorize('ADMIN', 'HR'), approveEmployee);
router.put('/:id/reject', authorize('ADMIN', 'HR'), rejectEmployee);

router.post('/departments', authorize('ADMIN', 'HR'), createDepartment);

export default router;
