import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Poll } from 'shared';
import getResults from 'src/common/utils/get-results.util';
import { IDGenerator } from 'src/common/utils/id-generator.util';
import { PollsRepository } from './polls.repository';
import {
  AddNominationFields,
  AddParticipantFields,
  AddParticipantRankingsFields,
  CreatePollFields,
  JoinPollFields,
  RejoinPollFields,
  RemoveNominationFields,
  RemoveParticipantFields,
} from './polls.types';

@Injectable()
export class PollsService {
  private readonly logger = new Logger(PollsService.name);

  constructor(
    private readonly pollsRepository: PollsRepository,
    private readonly jwtService: JwtService,
  ) {}

  async createPoll(fields: CreatePollFields) {
    const pollID = IDGenerator.createPollID();
    const userID = IDGenerator.createUserID();

    const poll = await this.pollsRepository.createPoll({
      ...fields,
      pollID,
      userID,
    });

    this.logger.log(`Creating access token for poll ${pollID}`);

    const accessToken = this.jwtService.sign(
      {
        pollID: poll.id,
        name: fields.name,
      },
      { subject: userID },
    );

    return { poll, accessToken };
  }

  async startPoll(pollID: string): Promise<Poll> {
    return await this.pollsRepository.startPoll(pollID);
  }

  async getPoll(pollID: string): Promise<Poll> {
    return await this.pollsRepository.getPoll(pollID);
  }

  async joinPoll(fields: JoinPollFields) {
    const userID = IDGenerator.createUserID();

    this.logger.log(`User ${userID} joining poll ${fields.pollID}`);

    const poll = await this.pollsRepository.getPoll(fields.pollID);

    this.logger.log(`Creating access token for poll ${fields.pollID}`);

    const accessToken = this.jwtService.sign(
      {
        pollID: poll.id,
        name: fields.name,
      },
      { subject: userID },
    );

    return { poll, accessToken };
  }

  async rejoinPoll(fields: RejoinPollFields) {
    this.logger.log(
      `User ${fields.userID}/${fields.name} re-joining poll ${fields.pollID}`,
    );

    const poll = await this.pollsRepository.addParticipant(fields);

    return poll;
  }

  async cancelPoll(pollID: string): Promise<void> {
    return await this.pollsRepository.deletePoll(pollID);
  }

  async addParticipant(fields: AddParticipantFields): Promise<Poll> {
    return await this.pollsRepository.addParticipant(fields);
  }

  async addParticipantRankings(
    fields: AddParticipantRankingsFields,
  ): Promise<Poll> {
    const poll = await this.pollsRepository.getPoll(fields.pollID);

    if (!poll.hasStarted) {
      throw new BadRequestException('Poll has not started');
    }

    return await this.pollsRepository.addParticipantRankings(fields);
  }

  async removeParticipant(fields: RemoveParticipantFields): Promise<Poll> {
    const poll = await this.pollsRepository.getPoll(fields.pollID);

    if (!poll.hasStarted) {
      const updatedPoll = await this.pollsRepository.removeParticipant(fields);
      return updatedPoll;
    }
  }

  async addNomination(fields: AddNominationFields): Promise<Poll> {
    return await this.pollsRepository.addNomination({
      pollID: fields.pollID,
      nominationID: IDGenerator.createNominationID(),
      nomination: {
        userID: fields.userID,
        text: fields.text,
      },
    });
  }

  async removeNomination(fields: RemoveNominationFields): Promise<Poll> {
    return await this.pollsRepository.removeNomination(fields);
  }

  async computeResults(pollID: string): Promise<Poll> {
    const poll = await this.pollsRepository.getPoll(pollID);
    const results = getResults(
      poll.rankings,
      poll.nominations,
      poll.votesPerVoter,
    );
    return await this.pollsRepository.addResults({ pollID, results });
  }
}
