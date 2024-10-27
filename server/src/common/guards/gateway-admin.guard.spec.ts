import { GatewayAdminGuard } from './gateway-admin.guard';

describe('GatewayAdminGuard', () => {
  it('should be defined', () => {
    expect(new GatewayAdminGuard()).toBeDefined();
  });
});
