import { nanoid } from 'nanoid';
import { Poll } from 'shared';
import { Socket } from 'socket.io-client';
import { proxy, ref } from 'valtio';
import { subscribeKey } from 'valtio/utils';
import {
  createSocketWithHandlers,
  SOCKET_IO_URL,
} from '../utils/socket-io.util';
import { getTokenPayload } from '../utils/util';

export enum AppPage {
  Welcome = 'welcome',
  Create = 'create',
  Join = 'join',
  WaitingRoom = 'waiting-room',
  Voting = 'voting',
  Results = 'results',
}

type Me = {
  id: string;
  name: string;
};

type WsError = {
  type: string;
  message: string;
};

type WsErrorUnique = WsError & {
  id: string;
};

export type AppState = {
  isLoading: boolean;
  currentPage: AppPage;
  poll?: Poll;
  accessToken?: string;
  socket?: Socket;
  wsErrors: WsErrorUnique[];
  me?: Me;
  isAdmin: boolean;
  nominationCount: number;
  participantCount: number;
  canStartVote: boolean;
  hasVoted: boolean;
  rankingsCount: number;
};

const state = proxy<AppState>({
  isLoading: false,
  currentPage: AppPage.Welcome,
  wsErrors: [],
  get me() {
    const accessToken = this.accessToken;
    if (!accessToken) return;
    const token = getTokenPayload(accessToken);
    return { id: token.sub, name: token.name };
  },
  get isAdmin() {
    if (!this.me) return false;
    return this.me?.id === this.poll?.adminID;
  },
  get nominationCount() {
    return Object.keys(this.poll?.nominations || {}).length;
  },
  get participantCount() {
    return Object.keys(this.poll?.participants || {}).length;
  },
  get canStartVote() {
    const votesPerVoter = this.poll?.votesPerVoter ?? 100;
    return this.nominationCount >= votesPerVoter;
  },
  get hasVoted() {
    const rankings = this.poll?.rankings || {};
    const userID = this.me?.id;
    return rankings[userID] !== undefined ? true : false;
  },
  get rankingsCount() {
    return Object.keys(this.poll?.rankings || {}).length;
  },
});

const actions = {
  setPage: (page: AppPage) => {
    state.currentPage = page;
  },
  startOver: () => {
    actions.reset();
    localStorage.removeItem('accessToken');
    state.currentPage = AppPage.Welcome;
  },
  startLoading: () => {
    state.isLoading = true;
  },
  stopLoading: () => {
    state.isLoading = false;
  },
  initializePoll: (poll?: Poll) => {
    state.poll = poll;
  },
  setPollAccessToken: (accessToken: string) => {
    state.accessToken = accessToken;
  },
  initializeSocket: () => {
    if (!state.socket) {
      state.socket = ref(
        createSocketWithHandlers({ socketIOUrl: SOCKET_IO_URL, state, actions })
      );
      return;
    }
    if (!state.socket.connected) {
      state.socket.connect();
      return;
    }
    actions.stopLoading();
  },
  updatePoll: (poll: Poll) => {
    state.poll = poll;
  },
  addWsError: (error: WsError) => {
    state.wsErrors = [...state.wsErrors, { ...error, id: nanoid(6) }];
  },
  removeWsError: (id: string) => {
    state.wsErrors = state.wsErrors.filter((error) => error.id !== id);
  },
  nominate: (text: string) => {
    console.log('nominate', text);

    state.socket?.emit('nominate', { text });
  },
  removeNomination: (id: string) => {
    state.socket?.emit('remove_nomination', { id });
  },
  removeParticipant: (id: string) => {
    state.socket?.emit('remove_participant', { id });
  },
  startVote: () => {
    state.socket?.emit('start_vote');
  },
  submitRankings: (rankings: string[]) => {
    state.socket?.emit('submit_rankings', { rankings });
  },
  cancelPoll: () => {
    state.socket?.emit('cancel_poll');
  },
  closePoll: () => {
    state.socket?.emit('close_poll');
  },
  reset: () => {
    state.socket?.disconnect();
    state.poll = undefined;
    state.accessToken = undefined;
    state.isLoading = false;
    state.socket = undefined;
    state.wsErrors = [];
  },
};

subscribeKey(state, 'accessToken', () => {
  if (state.accessToken) {
    localStorage.setItem('accessToken', state.accessToken);
  }
});

export type AppActions = typeof actions;

export { actions, state };
