import { Controller, Get, Post, Body, UseGuards, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { Product } from './entities/product.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ 
    status: 201, 
    type: Product,
    schema: {
      example: {
        success: true,
        statusCode: 201,
        message: 'Request processed successfully',
        data: { id: 1, name: 'Apple', description: 'Fresh Red Apples', createdAt: '2026-02-26T10:00:00.000Z' },
        timestamp: '2026-02-26T10:00:00.000Z'
      }
    }
  })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ 
    status: 200, 
    type: [Product],
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'Request processed successfully',
        data: [
          { id: 1, name: 'Apple', description: 'Fresh Red Apples', createdAt: '2026-02-26T10:00:00.000Z' },
          { id: 2, name: 'Banana', description: 'Sweet Cavendish Bananas', createdAt: '2026-02-26T10:01:00.000Z' }
        ],
        timestamp: '2026-02-26T10:05:00.000Z'
      }
    }
  })
  findAll() {
    return this.productsService.findAll();
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed dummy products' })
  @ApiResponse({ status: 201, description: 'Products seeded successfully' })
  seed() {
    return this.productsService.seed();
  }
}
