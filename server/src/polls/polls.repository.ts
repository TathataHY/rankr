import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { Poll } from 'shared';
import { IOREDIS_KEY } from 'src/redis/redis.module';
import {
  AddNominationData,
  AddParticipantData,
  AddParticipantRankingsData,
  AddResultsData,
  CreatePollData,
  RemoveNominationData,
  RemoveParticipantData,
} from './polls.types';

@Injectable()
export class PollsRepository {
  private readonly ttl: string;
  private readonly logger = new Logger(PollsRepository.name);

  constructor(
    @Inject(IOREDIS_KEY) private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {
    this.ttl = this.configService.get('POLL_DURATION');
  }

  async createPoll(data: CreatePollData): Promise<Poll> {
    const initialPoll: Poll = {
      id: data.pollID,
      topic: data.topic,
      participants: {},
      votesPerVoter: data.votesPerVoter,
      adminID: data.userID,
      nominations: {},
      rankings: {},
      results: [],
      hasStarted: false,
    };

    const key = `polls:${data.pollID}`;

    try {
      const result = await this.redis
        .multi()
        .set(key, JSON.stringify(initialPoll))
        .expire(key, parseInt(this.ttl))
        .exec();

      if (!result || result[0][0] || result[1][0]) {
        throw new Error(`Failed to create poll: ${JSON.stringify(result)}`);
      }

      return initialPoll;
    } catch (error) {
      this.logger.error(`Error creating poll: ${error.message}`);
      throw new InternalServerErrorException('Failed to create poll');
    }
  }

  async getPoll(pollID: string): Promise<Poll> {
    const key = `polls:${pollID}`;

    try {
      const pollJSON = await this.redis.get(key);

      if (!pollJSON) {
        throw new Error('Poll not found');
      }

      return JSON.parse(pollJSON);
    } catch (error) {
      this.logger.error(`Error getting poll ${pollID}: ${error.message}`);
      throw new InternalServerErrorException('Failed to get poll');
    }
  }

  async addParticipant(data: AddParticipantData): Promise<Poll> {
    const key = `polls:${data.pollID}`;

    try {
      const currentPollJSON = await this.redis.get(key);
      if (!currentPollJSON) {
        throw new Error(`Poll ${data.pollID} not found`);
      }

      const currentPoll: Poll = JSON.parse(currentPollJSON);
      currentPoll.participants[data.userID] = data.name;

      const result = await this.redis.set(key, JSON.stringify(currentPoll));

      if (result !== 'OK') {
        throw new Error(`Redis operation failed. Result: ${result}`);
      }

      return currentPoll;
    } catch (error) {
      this.logger.error(`Error adding participant: ${error.message}`);
      throw new InternalServerErrorException('Failed to add participant');
    }
  }

  async removeParticipant(data: RemoveParticipantData): Promise<Poll> {
    const key = `polls:${data.pollID}`;

    try {
      const currentPollJSON = await this.redis.get(key);
      if (!currentPollJSON) {
        throw new Error(`Poll ${data.pollID} not found`);
      }

      const currentPoll: Poll = JSON.parse(currentPollJSON);

      if (currentPoll.participants[data.userID]) {
        delete currentPoll.participants[data.userID];
      }

      const result = await this.redis.set(key, JSON.stringify(currentPoll));

      if (result !== 'OK') {
        throw new Error(`Redis operation failed. Result: ${result}`);
      }

      return currentPoll;
    } catch (error) {
      this.logger.error(`Error removing participant: ${error.message}`);
      throw new InternalServerErrorException('Failed to remove participant');
    }
  }

  async addNomination(data: AddNominationData): Promise<Poll> {
    const key = `polls:${data.pollID}`;

    try {
      const currentPollJSON = await this.redis.get(key);
      if (!currentPollJSON) {
        throw new Error(`Poll ${data.pollID} not found`);
      }

      const currentPoll: Poll = JSON.parse(currentPollJSON);
      currentPoll.nominations[data.nominationID] = data.nomination;

      const result = await this.redis.set(key, JSON.stringify(currentPoll));

      if (result !== 'OK') {
        throw new Error(`Redis operation failed. Result: ${result}`);
      }

      return currentPoll;
    } catch (error) {
      this.logger.error(`Error adding nomination: ${error.message}`);
      throw new InternalServerErrorException('Failed to add nomination');
    }
  }

  async removeNomination(data: RemoveNominationData): Promise<Poll> {
    const key = `polls:${data.pollID}`;

    try {
      const currentPollJSON = await this.redis.get(key);
      if (!currentPollJSON) {
        throw new Error(`Poll ${data.pollID} not found`);
      }

      const currentPoll: Poll = JSON.parse(currentPollJSON);

      if (currentPoll.nominations[data.nominationID]) {
        delete currentPoll.nominations[data.nominationID];
      }

      const result = await this.redis.set(key, JSON.stringify(currentPoll));

      if (result !== 'OK') {
        throw new Error(`Redis operation failed. Result: ${result}`);
      }

      return currentPoll;
    } catch (error) {
      this.logger.error(`Error removing nomination: ${error.message}`);
      throw new InternalServerErrorException('Failed to remove nomination');
    }
  }

  async addParticipantRankings(
    data: AddParticipantRankingsData,
  ): Promise<Poll> {
    const key = `polls:${data.pollID}`;

    try {
      const currentPollJSON = await this.redis.get(key);
      if (!currentPollJSON) {
        throw new Error(`Poll ${data.pollID} not found`);
      }

      const currentPoll: Poll = JSON.parse(currentPollJSON);
      currentPoll.rankings[data.userID] = data.rankings;

      const result = await this.redis.set(key, JSON.stringify(currentPoll));

      if (result !== 'OK') {
        throw new Error(`Redis operation failed. Result: ${result}`);
      }

      return currentPoll;
    } catch (error) {
      this.logger.error(`Error adding participant rankings: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to add participant rankings',
      );
    }
  }

  async addResults(data: AddResultsData): Promise<Poll> {
    const key = `polls:${data.pollID}`;

    try {
      const currentPollJSON = await this.redis.get(key);
      if (!currentPollJSON) {
        throw new Error(`Poll ${data.pollID} not found`);
      }

      const currentPoll: Poll = JSON.parse(currentPollJSON);
      currentPoll.results = data.results;

      const result = await this.redis.set(key, JSON.stringify(currentPoll));

      if (result !== 'OK') {
        throw new Error(`Redis operation failed. Result: ${result}`);
      }

      return currentPoll;
    } catch (error) {
      this.logger.error(`Error adding results: ${error.message}`);
      throw new InternalServerErrorException('Failed to add results');
    }
  }

  async deletePoll(pollID: string): Promise<void> {
    const key = `polls:${pollID}`;

    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Error deleting poll: ${error.message}`);
      throw new InternalServerErrorException('Failed to delete poll');
    }
  }

  async startPoll(pollID: string): Promise<Poll> {
    const key = `polls:${pollID}`;

    try {
      const currentPollJSON = await this.redis.get(key);
      if (!currentPollJSON) {
        throw new Error(`Poll ${pollID} not found`);
      }

      const currentPoll: Poll = JSON.parse(currentPollJSON);
      currentPoll.hasStarted = true;

      const result = await this.redis.set(key, JSON.stringify(currentPoll));

      if (result !== 'OK') {
        throw new Error(`Redis operation failed. Result: ${result}`);
      }

      return currentPoll;
    } catch (error) {
      this.logger.error(`Error starting poll: ${error.message}`);
      throw new InternalServerErrorException('Failed to start poll');
    }
  }
}
