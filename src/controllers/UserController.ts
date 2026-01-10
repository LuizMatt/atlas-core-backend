import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { CreateUserRequest } from '../models/User';

export class UserController {
  private userService = new UserService();

  async createUser(req: Request, res: Response) {
    try {
      const { name, email, password, role }: CreateUserRequest = req.body;

      let userRole: 'client' | 'admin' = 'client';
      if (role === 'admin') {
        if (!req.user || req.user.role !== 'admin') {
          return res.status(403).json({ message: 'Somente administradores podem criar outros admins' });
        }
        userRole = 'admin';
      }

      const user = await this.userService.createUser({
        name,
        email,
        password,
        role: userRole,
      });

      return res.status(201).json({ message: 'Usuário criado com sucesso', user });
    } catch (error) {
      return res.status(500).json({ message: error instanceof Error ? error.message : 'Erro interno' });
    }
  }

  async loginUser(req: Request, res: Response) {
    try {
      const { token, user } = await this.userService.loginUser(req.body);
      return res.json({ message: 'Login realizado com sucesso', token, user });
    } catch (error) {
      return res.status(401).json({ message: error instanceof Error ? error.message : 'Erro de autenticação' });
    }
  }

  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await this.userService.getAllUsers();
      return res.json(users);
    } catch (error) {
      return res.status(500).json({ message: error instanceof Error ? error.message : 'Erro interno' });
    }
  }

  async getUserById(req: Request, res: Response) {
    try {
      const user = await this.userService.getUserById(Number(req.params.id));
      return res.json(user);
    } catch (error) {
      return res.status(404).json({ message: error instanceof Error ? error.message : 'Usuário não encontrado' });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const userId = Number(req.params.id);

      if (!req.user || (req.user.id !== userId && req.user.role !== 'admin')) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      if ('role' in req.body && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Somente administradores podem alterar a role' });
      }

      const payload = { ...req.body };

      if (req.user.role !== 'admin') {
        delete payload.role;
      }

      const updated = await this.userService.updateUser(userId, payload);
      return res.json({ message: 'Usuário atualizado com sucesso', user: updated });
    } catch (error) {
      return res.status(404).json({ message: error instanceof Error ? error.message : 'Erro na atualização' });
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const userId = Number(req.params.id);

      if (!req.user || (req.user.id !== userId && req.user.role !== 'admin')) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      await this.userService.deleteUser(userId);
      return res.json({ message: 'Usuário excluído com sucesso' });
    } catch (error) {
      return res.status(404).json({ message: error instanceof Error ? error.message : 'Erro na exclusão' });
    }
  }
}