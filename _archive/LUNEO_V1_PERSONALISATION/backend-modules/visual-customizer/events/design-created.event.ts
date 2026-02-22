export class DesignCreatedEvent {
  constructor(
    public readonly designId: string,
    public readonly customizerId: string,
    public readonly userId: string,
    public readonly canvasData: unknown,
  ) {}
}
