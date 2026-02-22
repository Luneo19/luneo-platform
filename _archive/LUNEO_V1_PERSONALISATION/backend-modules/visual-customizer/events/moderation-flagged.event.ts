export class ModerationFlaggedEvent {
  constructor(
    public readonly recordId: string,
    public readonly brandId: string,
    public readonly designId: string | null,
    public readonly reasons: string[],
    public readonly confidence: number,
  ) {}
}
