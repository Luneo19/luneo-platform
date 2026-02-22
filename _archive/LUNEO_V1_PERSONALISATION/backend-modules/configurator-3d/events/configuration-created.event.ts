/**
 * Configurator 3D - Configuration Created Event
 */

export class ConfigurationCreatedEvent {
  constructor(
    public readonly configurationId: string,
    public readonly brandId: string,
    public readonly userId: string | null,
    public readonly name: string,
    public readonly type: string,
    public readonly createdAt: Date,
  ) {}
}
