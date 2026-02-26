import { IsEnum, IsNumber, IsPositive, IsDateString, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TransactionType } from '../entities/transaction.entity';

export class CreateTransactionDto {
  @ApiProperty({ example: 1, description: 'ID of the product' })
  @IsNumber()
  productId: number;

  @ApiProperty({ enum: TransactionType, example: TransactionType.PURCHASE })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ example: '2026-02-01', description: 'Date of transaction (YYYY-MM-DD)' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 150, description: 'Quantity of the transaction' })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({ example: 2, description: 'Price per unit (Purchase cost or Selling price)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;
}
