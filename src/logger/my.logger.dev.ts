import { ConsoleLogger } from "@nestjs/common";

export class MyLoggerDev extends ConsoleLogger {
  console.log(``);
}