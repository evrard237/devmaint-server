import { protect } from '../controllers/auth.js';
import express from "express";
import { 
    createMaintenanceReport, 
    getListMaintenanceReport, 
    getSingleMaintenanceReport, 
    downloadReportPDF, 
    previewReportPDF 
} from '../controllers/maintenanceReport.js';
import { accessPermission } from '../permissions/user.js';

const router = express.Router();

router.use(protect);

router.get('/', accessPermission(["admin","user"]), getListMaintenanceReport);
router.post('/create', accessPermission(["admin","user"]), createMaintenanceReport);
router.get('/:id', accessPermission(["admin","user"]), getSingleMaintenanceReport);
router.get('/download/:id', accessPermission(["admin","user"]), downloadReportPDF);
router.get('/preview/:id', accessPermission(["admin","user"]), previewReportPDF);

export default router;