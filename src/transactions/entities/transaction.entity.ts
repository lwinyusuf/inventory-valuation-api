import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';

export enum TransactionType {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
}

@Entity('transactions')
export class Transaction {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ enum: TransactionType, example: TransactionType.PURCHASE })
  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @ApiProperty({ example: '2026-02-26' })
  @Column({ type: 'date' })
  date: string; // Using string for date to match the "one per date" constraint easily

  @ApiProperty({ example: 10 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @ApiProperty({ example: 2.5, required: false, description: 'Unit price for the product' })
  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  unitPrice: number;

  @ApiProperty({ example: 25.0, description: 'Calculated total value for the transaction' })
  @Column({ name: 'total_value', type: 'decimal', precision: 10, scale: 2 })
  totalValue: number;

  @ApiProperty({ example: 2.5, description: 'The WAC at the time of this transaction' })
  @Column({ name: 'average_cost', type: 'decimal', precision: 10, scale: 2 })
  averageCost: number;

  @ApiProperty({ example: 150, description: 'Running quantity after this transaction' })
  @Column({ name: 'running_quantity', type: 'decimal', precision: 10, scale: 2, default: 0 })
  runningQuantity: number;

  @ApiProperty({ example: 300.0, description: 'Running total inventory value after this transaction' })
  @Column({ name: 'running_total_value', type: 'decimal', precision: 10, scale: 2, default: 0 })
  runningTotalValue: number;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
