import { IsString, IsNotEmpty, IsInt, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({ example: '650f1a2b3c4d5e6f7a8b9c0d' })
  @IsString()
  @IsNotEmpty({ message: 'productId is required' })
  productId: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @IsInt({ message: 'quantity must be a whole number' })
  @Min(1, { message: 'quantity must be at least 1' })
  @Type(() => Number)
  quantity?: number;
}
