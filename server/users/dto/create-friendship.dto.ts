import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class CreateFriendshipDto {
  @ApiProperty({ example: 'friend@example.com' })
  @IsEmail()
  email: string;
}
