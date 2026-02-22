import { Injectable } from '@nestjs/common';

@Injectable()
export class ReferralService {
  async recordReferral(_data: any): Promise<void> {}
  async validateReferralCode(_code: string): Promise<boolean> { return false; }
  async getReferralStats(_userId: string): Promise<any> { return {}; }
}
