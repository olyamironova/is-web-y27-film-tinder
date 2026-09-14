import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}

export class CatalogQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search by title (substring)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by genre name' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  genre?: string;

  @ApiPropertyOptional({ minimum: 1888, maximum: 2100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1888)
  @Max(2100)
  yearFrom?: number;

  @ApiPropertyOptional({ minimum: 1888, maximum: 2100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1888)
  @Max(2100)
  yearTo?: number;
}
