import { Field, InputType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { SwipeDirection } from '../../users/entities/swipe.entity.js';

@InputType()
export class SwipeDto {
  @Field(() => SwipeDirection)
  @ApiProperty({ enum: SwipeDirection })
  @IsEnum(SwipeDirection)
  direction: SwipeDirection;
}
