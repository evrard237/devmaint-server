import { protect } from '../controllers/auth.js';
import express from "express"
import { createMaintenanceCall, getListMaintenanceCall, getMaintenanceCallsPerUser, getSingleMaintenanceCall, updateMaintenanceCall } from '../controllers/maintenanceCall.js';
import { accessPermission } from '../permissions/user.js';


const router = express.Router();



router.get('/',protect,accessPermission(["admin","user"]),getListMaintenanceCall);
router.get("/:id",protect,accessPermission(["admin","user"]),getSingleMaintenanceCall);
router.get("/peruser",protect,accessPermission(["guest"]),getMaintenanceCallsPerUser);
router.post('/create',protect,accessPermission(["guest"]),createMaintenanceCall);
// router.patch("/update/:id",protect,updateMaintenanceCall);
// router.delete("/:id",protect,deleteDepartment)


export default router;