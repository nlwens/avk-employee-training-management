import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageProvider } from '../enums/storage-provider.enum';
import { IFileProvider } from './file-provider.interface';
import { DiscoveryService } from '@nestjs/core';
import { StorageProviderError } from '../exceptions/storage-provider.exception';

@Injectable()
export class StorageProviderSelector implements OnModuleInit {
  private defaultProviderType: StorageProvider;
  private providers: Map<StorageProvider, IFileProvider> = new Map();

  constructor(
    configService: ConfigService,
    private readonly discoveryService: DiscoveryService,
  ) {
    this.defaultProviderType =
      configService.get<StorageProvider>('DEFAULT_STORAGE_PROVIDER') ||
      StorageProvider.LOCAL;
  }

  onModuleInit(): void {
    for (const provider of this.discoveryService.getProviders()) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { instance } = provider;

      // The provider is only a reference or an incomplete object.
      if (
        !instance ||
        !Object.getPrototypeOf(instance) ||
        typeof instance !== 'object'
      ) {
        continue;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      if (Reflect.has(instance, 'getStorageProvider')) {
        this.providers.set(this.defaultProviderType, instance as IFileProvider);
      }
    }
  }

  /**
   * Retrieve a storage provider instance by the provider type.
   * @param provider enum value of a storage provider.
   */
  getProvider(provider: StorageProvider): IFileProvider {
    const fileProvider = this.providers.get(provider);
    if (!fileProvider)
      throw new StorageProviderError(
        `Storage provider '${provider} not found'`,
      );

    return fileProvider;
  }

  getDefaultProvider(): IFileProvider {
    const fileProvider = this.providers.get(this.defaultProviderType);
    if (!fileProvider)
      throw new StorageProviderError(
        `Default storage provider '${this.defaultProviderType} not found'`,
      );

    return fileProvider;
  }
}
