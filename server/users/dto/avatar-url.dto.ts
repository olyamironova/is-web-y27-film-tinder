import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AvatarUrlDto {
  @ApiProperty({ description: 'URL of an avatar from the user history' })
  @IsString()
  @IsNotEmpty()
  url: string;
}
