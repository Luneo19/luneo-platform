import { Injectable } from '@nestjs/common';

@Injectable()
export class DpaGeneratorService {
  generateTemplate(input: { organizationName: string; generatedBy: string }) {
    const date = new Date().toISOString().split('T')[0];
    return {
      title: 'Data Processing Agreement (DPA)',
      organization: input.organizationName,
      generatedBy: input.generatedBy,
      generatedAt: date,
      clauses: [
        'Scope of processing and sub-processors',
        'Data subject rights and response timelines',
        'Security controls and breach notification',
        'Retention and deletion obligations',
      ],
    };
  }
}
