import { protect, restrict } from "../controllers/auth.js";
import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  getSingleDept,
  updateDepartment,
} from "../controllers/department.js";
import express from "express";
import { accessPermission } from "../permissions/user.js";

const router = express.Router();

router.get("/", protect, accessPermission(["admin", "user"]), getDepartments);
router.get("/:id", protect, accessPermission(["admin", "user"]), getSingleDept),
  router.post(
    "/",
    protect,
    accessPermission(["admin", "user"]),
    createDepartment
  );
router.patch(
  "/:id",
  protect,
  accessPermission(["admin", "user"]),
  updateDepartment
);
router.delete(
  "/:id",
  protect,
  accessPermission(["admin", "user"]),
  deleteDepartment
);

export default router;
