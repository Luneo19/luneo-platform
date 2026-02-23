import { Injectable } from '@nestjs/common';
import type { AgentTool } from './index';

@Injectable()
export class ToolRegistryService {
  private tools = new Map<string, AgentTool>();

  register(tool: AgentTool): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): AgentTool | undefined {
    return this.tools.get(name);
  }

  getAll(): AgentTool[] {
    return Array.from(this.tools.values());
  }

  async executeTool(
    name: string,
    params: Record<string, unknown>,
    context: { organizationId: string },
  ): Promise<string> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool "${name}" not found`);
    }
    return tool.execute(params, context);
  }
}
