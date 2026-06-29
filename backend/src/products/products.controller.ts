import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

const NOT_IMPLEMENTED = { message: 'Not implemented yet', statusCode: 501 };

@ApiTags('products')
@Controller('products')
export class ProductsController {
  @Get()
  @ApiOperation({ summary: 'Get all products' })
  findAll() {
    return NOT_IMPLEMENTED;
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a product' })
  create(@Body() _body: any) {
    return NOT_IMPLEMENTED;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by id' })
  findOne(@Param('id') _id: string) {
    return NOT_IMPLEMENTED;
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product' })
  update(@Param('id') _id: string, @Body() _body: any) {
    return NOT_IMPLEMENTED;
  }

  @Delete(':id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a product' })
  remove(@Param('id') _id: string) {
    return NOT_IMPLEMENTED;
  }
}
