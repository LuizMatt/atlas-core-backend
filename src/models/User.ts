export class User {
  private id?: number;
  private name: string;
  private email: string;
  private password_hash: string;
  private role: 'client' | 'admin';
  private created_at: Date;

  constructor(data: {
    id?: number;
    name: string;
    email: string;
    password_hash: string;
    role?: 'client' | 'admin';
    created_at?: Date;
  }) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password_hash = data.password_hash;
    this.role = data.role || 'client';
    this.created_at = data.created_at || new Date();
  }

  getId() {
    return this.id;
  }

  getName() {
    return this.name;
  }

  getEmail() {
    return this.email;
  }

  getRole() {
    return this.role;
  }

  getCreatedAt() {
    return this.created_at;
  }

  setName(name: string) {
    this.name = name;
  }

  setEmail(email: string) {
    this.email = email;
  }

  setRole(role: 'client' | 'admin') {
    this.role = role;
  }

  getPasswordHash() {
    return this.password_hash;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      role: this.role,
      created_at: this.created_at
    };
  }
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role?: 'client' | 'admin';
}