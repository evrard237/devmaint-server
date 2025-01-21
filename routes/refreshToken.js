import { protect, restrict } from '../controllers/auth.js';
import { createDepartment, deleteDepartment, getDepartments, getSingleDept, updateDepartment } from '../controllers/department.js';
import express from "express"
import { refreshToken } from '../controllers/refreshToken.js';
import { accessPermission } from '../permissions/user.js';


const router = express.Router();




router.get('/',refreshToken);
// router.patch("/:id",protect,accessPermission(["admin","user"]),updateDepartment);
// router.delete("/:id",protect,restrict("admin"),deleteDepartment)


export default router;