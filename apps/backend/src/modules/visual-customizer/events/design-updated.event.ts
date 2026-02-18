export class DesignUpdatedEvent {
  constructor(
    public readonly designId: string,
    public readonly changes: unknown,
  ) {}
}
