import { WsException } from './ws.exception';

describe('WsException', () => {
  it('should be defined', () => {
    expect(new WsException()).toBeDefined();
  });
});
