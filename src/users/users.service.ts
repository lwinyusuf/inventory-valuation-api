import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(email: string, password: string): Promise<User> {
    if (!email || !email.includes('@')) {
      throw new BadRequestException('A valid email is required');
    }

    // Check if user already exists
    const existing = await this.usersRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException(`User with email ${email} already exists`);
    }

    const newUser = this.usersRepository.create({ email, password });
    return this.usersRepository.save(newUser);
  }

  async findOne(email: string): Promise<User> {
    const user = await this.usersRepository.findOne({ 
      where: { email },
      select: ['id', 'email', 'password'] 
    });

    // Thorw an exception if user is not found
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
  }

  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }
}