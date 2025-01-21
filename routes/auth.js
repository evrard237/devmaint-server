
import express from "express"
import { forgotPass, forgotPassword, login, logout, passwordResert, protect, signup, updatePassword } from "../controllers/auth.js";
import loginLimiter from "../utils/loginLimiter.js";


const router = express.Router();



// router.get('/', getUsers);
// router.post('/signup', signup);
router.post('/login',loginLimiter ,login);
// router.post('/login/guest',loginGuest);
router.post('/logout', logout);
router.post('/forgotpassword', forgotPassword);
router.post('/forgotpass',forgotPass);
router.patch('/resetpassword', passwordResert);
router.patch('/updatepassword',protect, updatePassword);


export default router;