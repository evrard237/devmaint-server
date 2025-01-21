import { protect, restrict } from '../controllers/auth.js';
import express from "express"
import { createUser, deleteUser, getSingleUser, getUsers, updateUser } from '../controllers/user.js';
import { accessPermission } from '../permissions/user.js';
// import { canViewUser } from '../permissions/user.js';


const router = express.Router();



router.get('/',protect,accessPermission(["admin"]),getUsers);
router.get("/:id",protect,accessPermission(["admin"]),getSingleUser),
router.post('/create/',protect,accessPermission(["admin"]),createUser);
router.patch("/update/:id",protect,accessPermission(["admin"]),updateUser);
router.delete("/:id",protect,accessPermission(["admin"]),deleteUser)


// function authGetUser(req,res,next) {
//     return(

//     )
// }

export default router;