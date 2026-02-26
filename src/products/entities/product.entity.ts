import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('products')
export class Product {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Widget A' })
  @Column({ unique: true })
  name: string;

  @ApiProperty({ example: 'High quality widget', required: false })
  @Column({ nullable: true })
  description: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}
