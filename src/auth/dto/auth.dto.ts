import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthDto {
  @ApiProperty({ example: 'hello@lwin.my', description: 'User email address' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({ example: 'password123', description: 'User password (min 6 chars)' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @IsString()
  password: string;
}