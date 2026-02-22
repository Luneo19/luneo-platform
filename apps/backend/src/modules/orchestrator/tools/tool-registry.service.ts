/**
 * @fileoverview Registry des outils disponibles pour les agents IA
 * @module ToolRegistryService
 */

import { Injectable, Optional } from '@nestjs/common';
import type { AgentTool } from './shopify-order.tool';
import { ShopifyOrderTool } from './shopify-order.tool';

@Injectable()
export class ToolRegistryService {
  private tools = new Map<string, AgentTool>();

  constructor(
    @Optional() private readonly shopifyOrderTool?: ShopifyOrderTool,
  ) {
    if (this.shopifyOrderTool) {
      this.register(this.shopifyOrderTool);
    }
  }

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
