/**
 * Configurator 3D - Session Completed Event
 */

export class SessionCompletedEvent {
  constructor(
    public readonly sessionId: string,
    public readonly configurationId: string,
    public readonly brandId: string,
    public readonly userId: string | null,
    public readonly selections: Record<string, unknown>,
    public readonly finalPrice: number,
    public readonly duration: number,
    public readonly conversionType?: string,
  ) {}
}
