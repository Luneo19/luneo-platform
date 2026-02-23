export { ToolRegistryService } from './tool-registry.service';

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute(params: Record<string, unknown>, context: { organizationId: string }): Promise<string>;
}
