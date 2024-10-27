import {
  Logger,
  UseFilters,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Namespace } from 'socket.io';
import { WsCatchAllFilter } from 'src/common/filters/ws-catch-all.filter';
import { GatewayAdminGuard } from 'src/common/guards/gateway-admin.guard';
import { NominationDto } from './dto/nomination.dto';
import { PollsService } from './polls.service';
import { SocketWithAuth } from './polls.types';

@WebSocketGateway({ namespace: 'polls' })
@UsePipes(new ValidationPipe())
@UseFilters(new WsCatchAllFilter())
export class PollsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(PollsGateway.name);

  @WebSocketServer()
  private namespace: Namespace;

  constructor(private readonly pollsService: PollsService) {}

  afterInit() {
    this.logger.log('Polls gateway initialized');
  }

  async handleConnection(client: SocketWithAuth) {
    const { pollID, userID, name } = client;
    await client.join(pollID);

    const connectedClients = this.getConnectedClientsCount(pollID);
    this.logger.log(
      `Client ${userID} connected to room ${pollID}. Connected clients: ${connectedClients}`,
    );

    const updatedPoll = await this.pollsService.addParticipant({
      pollID,
      userID,
      name,
    });
    this.namespace.to(pollID).emit('poll_updated', updatedPoll);
  }

  async handleDisconnect(client: SocketWithAuth) {
    const { pollID, userID } = client;
    await client.leave(pollID);

    const connectedClients = this.getConnectedClientsCount(pollID);
    this.logger.log(
      `Client ${userID} disconnected from room ${pollID}. Connected clients: ${connectedClients}`,
    );

    const updatedPoll = await this.pollsService.removeParticipant({
      pollID,
      userID,
    });
    if (updatedPoll) {
      this.namespace.to(pollID).emit('poll_updated', updatedPoll);
    }
  }

  @SubscribeMessage('start_vote')
  @UseGuards(GatewayAdminGuard)
  async startVote(@ConnectedSocket() client: SocketWithAuth) {
    this.logger.debug(`Starting voting for poll ${client.pollID}`);

    const updatedPoll = await this.pollsService.startPoll(client.pollID);
    if (updatedPoll) {
      this.namespace.to(client.pollID).emit('poll_updated', updatedPoll);
    }
  }

  @SubscribeMessage('submit_rankings')
  async submitRankings(
    @MessageBody('rankings') rankings: string[],
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    this.logger.debug(`Submitting rankings for poll ${client.pollID}`);

    const updatedPoll = await this.pollsService.addParticipantRankings({
      pollID: client.pollID,
      userID: client.userID,
      rankings,
    });
    if (updatedPoll) {
      this.namespace.to(client.pollID).emit('poll_updated', updatedPoll);
    }
  }

  @SubscribeMessage('remove_participant')
  @UseGuards(GatewayAdminGuard)
  async removeParticipant(
    @MessageBody('id') userID: string,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    this.logger.debug(
      `Removing participant ${userID} from poll ${client.pollID}`,
    );

    const updatedPoll = await this.pollsService.removeParticipant({
      pollID: client.pollID,
      userID,
    });
    if (updatedPoll) {
      this.namespace.to(client.pollID).emit('poll_updated', updatedPoll);
    }
  }

  @SubscribeMessage('nominate')
  async nominate(
    @MessageBody() nomination: NominationDto,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    this.logger.debug(
      `Nominating ${nomination.text} for poll ${client.pollID}`,
    );

    const updatedPoll = await this.pollsService.addNomination({
      pollID: client.pollID,
      userID: client.userID,
      text: nomination.text,
    });
    if (updatedPoll) {
      this.namespace.to(client.pollID).emit('poll_updated', updatedPoll);
    }
  }

  @SubscribeMessage('remove_nomination')
  @UseGuards(GatewayAdminGuard)
  async removeNomination(
    @MessageBody('id') nominationID: string,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    this.logger.debug(
      `Removing nomination ${nominationID} from poll ${client.pollID}`,
    );

    const updatedPoll = await this.pollsService.removeNomination({
      pollID: client.pollID,
      nominationID,
    });
    if (updatedPoll) {
      this.namespace.to(client.pollID).emit('poll_updated', updatedPoll);
    }
  }

  @SubscribeMessage('close_poll')
  @UseGuards(GatewayAdminGuard)
  async closePoll(@ConnectedSocket() client: SocketWithAuth) {
    this.logger.debug(`Closing poll ${client.pollID}`);

    const updatedPoll = await this.pollsService.computeResults(client.pollID);
    this.namespace.to(client.pollID).emit('poll_updated', updatedPoll);
  }

  @SubscribeMessage('cancel_poll')
  @UseGuards(GatewayAdminGuard)
  async cancelPoll(@ConnectedSocket() client: SocketWithAuth) {
    this.logger.debug(`Cancelling poll ${client.pollID}`);

    await this.pollsService.cancelPoll(client.pollID);
    this.namespace.to(client.pollID).emit('poll_cancelled');
  }

  private getConnectedClientsCount(room: string): number {
    return this.namespace.adapter.rooms?.get(room)?.size ?? 0;
  }
}
