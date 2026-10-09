import { Router } from 'express';
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
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

// Admin & HR management routes
router.post('/', authorize('ADMIN', 'HR'), createEmployee);
router.put('/:id', authorize('ADMIN', 'HR'), updateEmployee);
router.post('/departments', authorize('ADMIN', 'HR'), createDepartment);

export default router;
