import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from './entities/file.entity';
import { FilesService } from './files.service';
import { DriveStorageProvider } from './providers/drive-storage.provider';
import { StorageProviderSelector } from './providers/storage-provider.selector';
import { DiscoveryModule, DiscoveryService } from '@nestjs/core';

@Module({
  imports: [TypeOrmModule.forFeature([File]), DiscoveryModule],
  providers: [
    FilesService,
    DiscoveryService,
    DriveStorageProvider,
    StorageProviderSelector,
  ],
  exports: [FilesService],
})
export class FilesModule {}
