import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

@InputType({ description: 'Fields to update on a movie' })
export class UpdateMovieDto {
  @Field({ nullable: true })
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  posterUrl?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  backdropUrl?: string;

  @Field(() => Float, { nullable: true })
  @ApiPropertyOptional({ minimum: 0, maximum: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  rating?: number;

  @Field(() => Int, { nullable: true })
  @ApiPropertyOptional({ minimum: 1888, maximum: 2100 })
  @IsOptional()
  @IsInt()
  @Min(1888)
  @Max(2100)
  year?: number;

  @Field(() => [String], { nullable: true })
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  genres?: string[];

  @Field({ nullable: true })
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  director?: string;

  @Field(() => [String], { nullable: true })
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  cast?: string[];
}
