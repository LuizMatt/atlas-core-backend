import { upload } from '../config/multer';

export const uploadSingle = upload.single('image');
export const uploadMultiple = upload.array('images', 5);
