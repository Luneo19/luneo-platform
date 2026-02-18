/**
 * Configurator 3D - Conversion Event
 */

export class ConversionEvent {
  constructor(
    public readonly sessionId: string,
    public readonly configurationId: string,
    public readonly brandId: string,
    public readonly conversionType: string,
    public readonly value: number,
    public readonly orderId?: string | null,
    public readonly userId?: string | null,
  ) {}
}
