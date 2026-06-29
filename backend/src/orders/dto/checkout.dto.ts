import { IsObject, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckoutDto {
  @ApiPropertyOptional({ description: 'Shipping address object' })
  @IsOptional()
  @IsObject()
  shippingAddress?: Record<string, any>;

  @ApiProperty({
    description: 'Payment details (mock). Use card 4242 4242 4242 4242 to succeed.',
  })
  @IsObject()
  payment: Record<string, any>;

  @ApiPropertyOptional({ example: 9.99, description: 'Shipping cost added to total' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  shippingCost?: number;
}
