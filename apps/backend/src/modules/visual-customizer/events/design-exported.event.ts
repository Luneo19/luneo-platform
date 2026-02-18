export class DesignExportedEvent {
  constructor(
    public readonly exportId: string,
    public readonly sessionId: string,
    public readonly type: string,
    public readonly format: string,
  ) {}
}
