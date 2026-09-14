import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsUUID } from 'class-validator';

export class RoomSwipeDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  movieId: string;

  @ApiProperty({ enum: ['like', 'dislike'] })
  @IsIn(['like', 'dislike'])
  direction: 'like' | 'dislike';
}
