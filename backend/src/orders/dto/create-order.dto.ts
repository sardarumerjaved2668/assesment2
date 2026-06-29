import {
  IsArray,
  ArrayMinSize,
  IsOptional,
  IsNumber,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty({ description: 'Product snapshot (must include id, name, price)' })
  @IsObject()
  product: Record<string, any>;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Type(() => Number)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'An order must contain at least one item' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiPropertyOptional({ description: 'Shipping address object' })
  @IsOptional()
  @IsObject()
  shippingAddress?: Record<string, any>;

  @ApiPropertyOptional({ example: 9.99, description: 'Shipping cost added to total' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  shippingCost?: number;
}
