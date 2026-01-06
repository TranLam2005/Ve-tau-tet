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
  mergeFile(@Query('file') fileName: string, @Res() res: Response) {
    const nameDir = 'uploads/chunks-' + fileName;
    const files = fs.readdirSync(nameDir);
    let startPos = 0,
      countFile = 0;
    files.map((file) => {
      const filePath = nameDir + '/' + file;
      console.log('filePath | ', filePath);
      const streamFile = fs.createReadStream(filePath);
      streamFile
        .pipe(
          fs.createWriteStream('uploads/merge' + '/' + fileName, {
            start: startPos,
          }),
        )
        .on('finish', () => {
          countFile++;
          if (countFile === files.length) {
            fs.rmSync(nameDir, { recursive: true });
          }
        });
      startPos += fs.statSync(filePath).size;
    });
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
