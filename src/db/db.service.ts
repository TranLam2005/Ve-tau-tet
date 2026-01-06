import { Inject, Injectable } from '@nestjs/common';
import type { DbModuleOptions } from './db.module';
import { writeFile, access, readFile } from 'fs/promises';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class DbService {
  @Inject('OPTIONS')
  private options: DbModuleOptions;

  async read() {
    const path = this.options.path;
    try {
      await access(path);
    } catch {
      await writeFile(path, JSON.stringify([]));
    }
    const data = await readFile(path, {
      encoding: 'utf-8',
    });
    const parsed: unknown = JSON.parse(data);
    return (Array.isArray(parsed) ? parsed : []) as User[];
  }

  async write(obj: Record<string, any>) {
    await writeFile(this.options.path, JSON.stringify(obj || []), {
      encoding: 'utf-8',
    });
  }
}
