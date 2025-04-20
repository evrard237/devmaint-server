// import { createDevice, deleteDevice, getDevice, getDevices, updateDevice } from '../controllers/device';
import { protect, restrict } from '../controllers/auth.js';
import { createDevice, deleteDevice, getDevice, getDevices, getDevicesPerDept, updateDevice } from '../controllers/device.js';

import { Router } from 'express';
import { accessPermission } from '../permissions/user.js';

const router = Router();



router.get('/',protect,accessPermission(["admin","user"]), getDevices);
router.get('/:id',protect,accessPermission(["admin","user"]) ,getDevice);
router.get('/specific/:id',protect,accessPermission(["admin","guest"]),getDevicesPerDept);
router.post('/create',protect,accessPermission(["admin","user"]) ,createDevice);
router.patch('/:id',protect,accessPermission(["admin","user"]) ,updateDevice);
router.delete('/:id',protect,accessPermission(["admin","user"]) ,restrict('admin'),deleteDevice);



// export default router
export default router