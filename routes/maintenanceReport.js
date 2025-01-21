import { protect } from '../controllers/auth.js';
import express from "express"
import { createMaintenanceReport, getListMaintenanceReport, getSingleMaintenanceReport, sortReportByDevice, updateMaintenanceReport } from '../controllers/maintenanceReport.js';
import { accessPermission } from '../permissions/user.js';


const router = express.Router();



router.get('/',accessPermission(["admin","user"]),getListMaintenanceReport);
router.get("/:id",protect,accessPermission(["admin","user"]),getSingleMaintenanceReport),
router.get("/sortbydevicename/:name",protect,accessPermission(["admin","user"]),sortReportByDevice)
router.post('/create',protect,accessPermission(["admin","user"]),createMaintenanceReport);
router.patch("/update/:id",protect,accessPermission(["admin","user"]),updateMaintenanceReport);
// router.delete("/:id",protect,deleteDepartment)


export default router;