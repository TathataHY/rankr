import { Request as ExpressRequest } from 'express';
import { Nomination, Results } from 'shared';
import { Socket } from 'socket.io';

// service types
export type CreatePollFields = {
  topic: string;
  votesPerVoter: number;
  name: string;
};

export type JoinPollFields = {
  pollID: string;
  name: string;
};

export type RejoinPollFields = {
  pollID: string;
  userID: string;
  name: string;
};

export type AddParticipantFields = {
  pollID: string;
  userID: string;
  name: string;
};

export type RemoveParticipantFields = {
  pollID: string;
  userID: string;
};

export type AddNominationFields = {
  pollID: string;
  userID: string;
  text: string;
};

export type RemoveNominationFields = {
  pollID: string;
  nominationID: string;
};

export type AddParticipantRankingsFields = {
  pollID: string;
  userID: string;
  rankings: string[];
};

// repository types
export type CreatePollData = {
  pollID: string;
  topic: string;
  votesPerVoter: number;
  userID: string;
};

export type AddParticipantData = {
  pollID: string;
  userID: string;
  name: string;
};

export type RemoveParticipantData = {
  pollID: string;
  userID: string;
};

export type AddNominationData = {
  pollID: string;
  nominationID: string;
  nomination: Nomination;
};

export type RemoveNominationData = {
  pollID: string;
  nominationID: string;
};

export type AddParticipantRankingsData = {
  pollID: string;
  userID: string;
  rankings: string[];
};

export type AddResultsData = {
  pollID: string;
  results: Results;
};

// guards types
export type AuthPayload = {
  pollID: string;
  userID: string;
  name: string;
};

export type RequestWithAuth = ExpressRequest & AuthPayload;

export type SocketWithAuth = Socket & AuthPayload;
