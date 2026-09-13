import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsNumber, IsString, Max, MaxLength, Min } from 'class-validator';

@InputType({ description: 'Data required to create a movie' })
export class CreateMovieDto {
  @Field()
  @ApiProperty({ example: 'Интерстеллар' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @Field()
  @ApiProperty({ example: 'Команда исследователей отправляется через червоточину.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @Field()
  @ApiProperty({ example: 'https://example.com/poster.jpg' })
  @IsString()
  @IsNotEmpty()
  posterUrl: string;

  @Field()
  @ApiProperty({ example: 'https://example.com/backdrop.jpg' })
  @IsString()
  @IsNotEmpty()
  backdropUrl: string;

  @Field(() => Float)
  @ApiProperty({ minimum: 0, maximum: 10, example: 8.6 })
  @IsNumber()
  @Min(0)
  @Max(10)
  rating: number;

  @Field(() => Int)
  @ApiProperty({ minimum: 1888, maximum: 2100, example: 2014 })
  @IsInt()
  @Min(1888)
  @Max(2100)
  year: number;

  @Field(() => [String])
  @ApiProperty({ type: [String], example: ['Фантастика', 'Драма'] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  genres: string[];

  @Field()
  @ApiProperty({ example: 'Кристофер Нолан' })
  @IsString()
  @IsNotEmpty()
  director: string;

  @Field(() => [String])
  @ApiProperty({ type: [String], example: ['Мэттью Макконахи', 'Энн Хэтэуэй'] })
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  cast: string[];
}
