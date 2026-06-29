import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

const NOT_IMPLEMENTED = { message: 'Not implemented yet', statusCode: 501 };

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  findAll() {
    return NOT_IMPLEMENTED;
  }

  @Post()
  @ApiOperation({ summary: 'Create an order' })
  create(@Body() _body: any) {
    return NOT_IMPLEMENTED;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an order by id' })
  findOne(@Param('id') _id: string) {
    return NOT_IMPLEMENTED;
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  updateStatus(@Param('id') _id: string, @Body() _body: any) {
    return NOT_IMPLEMENTED;
  }
}
