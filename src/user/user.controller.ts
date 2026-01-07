import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  UploadedFiles,
  Query,
  Res,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { storage } from './oss';
import * as path from 'path';
import * as fs from 'fs';
import type { Response } from 'express';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Get('merge/file')
  async mergeFile(@Query('file') fileName: string, @Res() res: Response) {
    const nameDir = 'uploads/chunks-' + fileName;
    const mergeDir = 'uploads/merge';
    const mergePath = mergeDir + '/' + fileName;

    // ensure merge dir exists
    if (!fs.existsSync(mergeDir)) {
      fs.mkdirSync(mergeDir, { recursive: true });
    }

    // Create an empty file before (required for flags: 'r+')
    fs.writeFileSync(mergePath, '');

    const files = fs.readdirSync(nameDir);
    let startPos = 0;
    files.sort((a, b) => {
      const numA = parseInt(a.match(/-(\d+)$/)?.[1] ?? '0');
      const numB = parseInt(b.match(/-(\d+)$/)?.[1] ?? '0');
      return numA - numB;
    });
    for (const file of files) {
      const filePath = nameDir + '/' + file;
      console.log('filePath | ', filePath);
      const streamFile = fs.createReadStream(filePath);
      await new Promise<void>((resolve, reject) => {
        streamFile
          .pipe(
            fs.createWriteStream(mergePath, {
              flags: 'r+', // Keep old content, do not delete
              start: startPos,
            }),
          )
          .on('finish', resolve)
          .on('error', reject);
      });
      startPos += fs.statSync(filePath).size;
    }
    fs.rmSync(nameDir, { recursive: true });
    return res.json({
      link: 'http://localhost:3000/uploads/merge/' + fileName,
      fileName,
    });
  }
  // upload avt
  @Post('upload/large-file')
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      dest: 'uploads/',
    }),
  )
  uploadLargeFiles(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() body: { name: string },
  ) {
    console.log('Upload file body', body);
    console.log('Upload files', files);
    // 1. get file name
    const fileName = body.name.match(/(.+)-\d+$/)?.[1] ?? body.name;
    const nameDir = 'uploads/chunks-' + fileName;
    // 2. make dir
    if (!fs.existsSync(nameDir)) {
      fs.mkdirSync(nameDir);
    }
    // 3. move file to dir
    fs.cpSync(files[0].path, nameDir + '/' + body.name);
    // 4. remove temp file
    fs.rmSync(files[0].path);
  }
  // upload avt
  @Post('upload/avt')
  @UseInterceptors(
    FileInterceptor('file', {
      dest: 'uploads/',
      storage: storage,
      limits: {
        fileSize: 1024 * 1024 * 3,
      },
      fileFilter(req, file, cb) {
        //extName
        const extName = path.extname(file.originalname);
        if (['.jpg', '.png', '.gif'].includes(extName)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Upload file error'), false);
        }
      },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return file.path;
  }

  @Post('new')
  register(@Body() registerUserDto: RegisterUserDto) {
    console.log(registerUserDto);
    return this.userService.register(registerUserDto);
  }

  @Post('login')
  login(@Body() loginUserDto: LoginUserDto) {
    return this.userService.login(loginUserDto);
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
