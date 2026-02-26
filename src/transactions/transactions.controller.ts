import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Transaction } from './entities/transaction.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Record a new purchase or sale transaction' })
  @ApiResponse({ 
    status: 201, 
    type: Transaction,
    schema: {
      example: {
        success: true,
        statusCode: 201,
        message: 'Request processed successfully',
        data: {
          id: 1,
          type: 'PURCHASE',
          date: '2022-01-01',
          quantity: 150,
          unitPrice: 2,
          totalValue: 300,
          averageCost: 2,
          runningQuantity: 150,
          runningTotalValue: 300,
          product: { id: 8, name: 'Apple' },
          createdAt: '2026-02-26T10:00:00.000Z'
        },
        timestamp: '2026-02-26T10:00:00.000Z'
      }
    }
  })
  create(@Body() dto: CreateTransactionDto, @GetUser() user: User) {
    return this.transactionsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all transactions' })
  @ApiQuery({ name: 'productId', required: false, type: Number })
  @ApiResponse({ 
    status: 200, 
    type: [Transaction],
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'Request processed successfully',
        data: [
          {
            id: 1,
            type: 'PURCHASE',
            date: '2022-01-01',
            quantity: 150,
            unitPrice: 2,
            totalValue: 300,
            averageCost: 2,
            runningQuantity: 150,
            runningTotalValue: 300,
            product: { id: 8, name: 'Apple' }
          },
          {
            id: 2,
            type: 'PURCHASE',
            date: '2022-01-05',
            quantity: 10,
            unitPrice: 1.5,
            totalValue: 15,
            averageCost: 1.97,
            runningQuantity: 160,
            runningTotalValue: 315,
            product: { id: 8, name: 'Apple' }
          }
        ],
        timestamp: '2026-02-26T10:05:00.000Z'
      }
    }
  })
  findAll(@Query('productId') productId?: number) {
    return this.transactionsService.findAll(productId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific transaction' })
  @ApiResponse({ 
    status: 200, 
    type: Transaction,
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'Request processed successfully',
        data: {
          id: 1,
          type: 'PURCHASE',
          date: '2022-01-01',
          quantity: 150,
          unitPrice: 2,
          totalValue: 300,
          averageCost: 2,
          runningQuantity: 150,
          runningTotalValue: 300,
          product: { id: 8, name: 'Apple' }
        },
        timestamp: '2026-02-26T10:10:00.000Z'
      }
    }
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.transactionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction (Adjusts following costs)' })
  @ApiResponse({ 
    status: 200, 
    type: Transaction,
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'Request processed successfully',
        data: {
          id: 1,
          type: 'PURCHASE',
          date: '2022-01-01',
          quantity: 200,
          unitPrice: 2,
          totalValue: 400,
          averageCost: 2,
          runningQuantity: 200,
          runningTotalValue: 400,
          product: { id: 8, name: 'Apple' }
        },
        timestamp: '2026-02-26T10:15:00.000Z'
      }
    }
  })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTransactionDto) {
    return this.transactionsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a transaction (Adjusts following costs)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Deleted successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'Transaction deleted successfully',
        data: null,
        timestamp: '2026-02-26T10:20:00.000Z'
      }
    }
  })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.transactionsService.delete(id);
  }
}
