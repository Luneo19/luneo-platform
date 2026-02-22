/**
 * Configurator 3D - Configuration Updated Event
 */

export class ConfigurationUpdatedEvent {
  constructor(
    public readonly configurationId: string,
    public readonly brandId: string,
    public readonly userId: string,
    public readonly changes: Record<string, unknown>,
    public readonly updatedAt: Date,
  ) {}
}
