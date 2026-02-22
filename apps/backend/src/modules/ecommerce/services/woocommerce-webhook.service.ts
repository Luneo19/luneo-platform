import { Injectable } from "@nestjs/common";
@Injectable()
export class StubService {
  [key: string]: any;
}
