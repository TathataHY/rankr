import { ControllerAuthGuard } from './controller-auth.guard';

describe('ControllerAuthGuard', () => {
  it('should be defined', () => {
    expect(new ControllerAuthGuard()).toBeDefined();
  });
});
