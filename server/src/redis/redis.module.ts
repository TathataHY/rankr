import {
  DynamicModule,
  FactoryProvider,
  Module,
  ModuleMetadata,
} from '@nestjs/common';
import IORedis, { Redis, RedisOptions } from 'ioredis';

export const IOREDIS_KEY = 'IORedis';

type RedisModuleOptions = {
  connectionOptions: RedisOptions;
  onClientReady?: (client: Redis) => void;
};

type RedisAsyncModuleOptions = {
  useFactory: (
    ...args: any[]
  ) => Promise<RedisModuleOptions> | RedisModuleOptions;
} & Pick<ModuleMetadata, 'imports'> &
  Pick<FactoryProvider, 'inject'>;

@Module({})
export class RedisModule {
  static async registerAsync(
    options: RedisAsyncModuleOptions,
  ): Promise<DynamicModule> {
    const redisProvider: FactoryProvider = {
      provide: IOREDIS_KEY,
      useFactory: async (...args: any[]) => {
        const moduleOptions = await options.useFactory(...args);
        const client = new IORedis(moduleOptions.connectionOptions);

        moduleOptions.onClientReady?.(client);

        return client;
      },
      inject: options.inject,
    };

    return {
      module: RedisModule,
      imports: options.imports,
      providers: [redisProvider],
      exports: [redisProvider],
    };
  }
}
