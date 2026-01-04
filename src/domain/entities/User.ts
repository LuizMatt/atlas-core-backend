type UserRole = 'admin' | 'customer';

type UserProps = {
  id: string;
  tenantId: string;
  email: string;
  role: UserRole;
  name?: string;
  passwordHash: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export class User {
  private id: string;
  private tenantId: string;
  private email: string;
  private role: UserRole;
  private name?: string;
  private passwordHash: string;
  private createdAt: Date;
  private updatedAt: Date;

  constructor(props: UserProps) {
    this.validateId(props.id);
    this.validateId(props.tenantId);
    this.validateEmail(props.email);
    this.validateRole(props.role);
    this.validatePasswordHash(props.passwordHash);

    if (props.name) this.validateName(props.name);

    this.id = props.id.trim();
    this.tenantId = props.tenantId.trim();
    this.email = props.email.trim().toLowerCase();
    this.role = props.role;
    this.name = props.name?.trim();
    this.passwordHash = props.passwordHash;

    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  getId() {
    return this.id;
  }

  getTenantId() {
    return this.tenantId;
  }

  getEmail() {
    return this.email;
  }

  getRole() {
    return this.role;
  }

  getName() {
    return this.name;
  }

  getCreatedAt() {
    return this.createdAt;
  }

  getUpdatedAt() {
    return this.updatedAt;
  }

  changeName(newName: string) {
    this.validateName(newName);
    this.name = newName.trim();
    this.touch();
  }

  changeEmail(newEmail: string) {
    this.validateEmail(newEmail);
    this.email = newEmail.trim().toLowerCase();
    this.touch();
  }

  changeRole(newRole: UserRole) {
    this.validateRole(newRole);
    this.role = newRole;
    this.touch();
  }

  changePasswordHash(newHash: string) {
    this.validatePasswordHash(newHash);
    this.passwordHash = newHash;
    this.touch();
  }

  getPasswordHashForAuthOnly() {
    return this.passwordHash;
  }

  private validateId(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('id must not be empty');
    }
  }

  private validateName(name: string) {
    if (name.trim().length < 2) {
      throw new Error('name must have at least 2 characters');
    }
  }

  private validateEmail(email: string) {
    const value = email.trim().toLowerCase();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    if (!ok) throw new Error('invalid email');
  }

  private validateRole(role: string) {
    const allowed: UserRole[] = ['admin', 'customer'];
    if (!allowed.includes(role as UserRole)) {
      throw new Error('invalid role');
    }
  }

  private validatePasswordHash(hash: string) {
    if (!hash || hash.trim().length < 20) {
      throw new Error('invalid password hash');
    }
  }

  private touch() {
    this.updatedAt = new Date();
  }
}
