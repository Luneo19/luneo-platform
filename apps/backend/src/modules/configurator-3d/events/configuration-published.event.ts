/**
 * Configurator 3D - Configuration Published Event
 */

export class ConfigurationPublishedEvent {
  constructor(
    public readonly configurationId: string,
    public readonly brandId: string,
    public readonly userId: string | null,
    public readonly publishedAt: Date,
  ) {}
}
