import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ControllerAuthGuard } from 'src/common/guards/controller-auth.guard';
import { CreatePollDto } from './dto/create-poll.dto';
import { JoinPollDto } from './dto/join-poll.dto';
import { PollsService } from './polls.service';
import { RequestWithAuth } from './polls.types';

@Controller('polls')
@UsePipes(new ValidationPipe())
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  @Post()
  create(@Body() createPollDto: CreatePollDto) {
    const result = this.pollsService.createPoll(createPollDto);

    return result;
  }

  @Post('join')
  async join(@Body() joinPollDto: JoinPollDto) {
    const result = this.pollsService.joinPoll(joinPollDto);

    return result;
  }

  @Post('rejoin')
  @UseGuards(ControllerAuthGuard)
  async rejoin(@Req() req: RequestWithAuth) {
    const result = this.pollsService.rejoinPoll({
      pollID: req.pollID,
      userID: req.userID,
      name: req.name,
    });

    return result;
  }

  @Post('add-participant')
  @UseGuards(ControllerAuthGuard)
  async addParticipant(@Req() req: RequestWithAuth) {
    const result = this.pollsService.addParticipant(req);

    return result;
  }
}
