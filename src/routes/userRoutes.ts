import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';

class UserRoutes {
  public router: Router;
  private userController: UserController;

  constructor() {
    this.router = Router();
    this.userController = new UserController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // POST para criar um novo usuário
    this.router.post('/register', (req, res) => this.userController.createUser(req, res));

    // POST para autenticar um usuário
    this.router.post('/login', (req, res) => this.userController.loginUser(req, res));

    // GET ALL
    this.router.get('/', authMiddleware, adminMiddleware, (req, res) => this.userController.getAllUsers(req, res));

    // GET BY ID
    this.router.get('/:id', authMiddleware, adminMiddleware, (req, res) => this.userController.getUserById(req, res));

    // UPDATE
    this.router.put('/:id', authMiddleware, (req, res) => this.userController.updateUser(req, res));

    // DELETE
    this.router.delete('/:id', authMiddleware, (req, res) => this.userController.deleteUser(req, res));
  }
}

export const userRoutes = new UserRoutes().router;