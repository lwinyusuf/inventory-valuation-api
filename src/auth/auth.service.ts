import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { AuthDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(dto: AuthDto) {
    const { email, password } = dto;

    // Hash password with a salt round of 10
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Delegate to UsersService to create the user
    const user = await this.usersService.create(email, hashedPassword);

    // Return user data
    const { password: _, ...result } = user;
    return result;
  }

  async login(dto: AuthDto) {
    const { email, password } = dto;

    try {
      //  Find user by email
      const user = await this.usersService.findOne(email);

      // Validate password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // Generate JWT
      const payload = { sub: user.id, email: user.email };
      return {
        access_token: this.jwtService.sign(payload),
        user: { id: user.id, email: user.email }
      };
      
    } catch (error) {
      if (error instanceof UnauthorizedException || error.status === 404) {
        throw new UnauthorizedException('Invalid credentials');
      }
      throw new InternalServerErrorException('An error occurred during login');
    }
  }
}