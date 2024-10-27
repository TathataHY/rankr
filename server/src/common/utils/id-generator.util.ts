import { customAlphabet, nanoid } from 'nanoid';

export class IDGenerator {
  private static readonly POLL_ALPHABET =
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  private static readonly POLL_ID_LENGTH = 6;
  private static readonly NOMINATION_ID_LENGTH = 8;

  private static pollIDGenerator = customAlphabet(
    IDGenerator.POLL_ALPHABET,
    IDGenerator.POLL_ID_LENGTH,
  );

  static createPollID(): string {
    return this.pollIDGenerator();
  }

  static createUserID(): string {
    return nanoid();
  }

  static createNominationID(): string {
    return nanoid(IDGenerator.NOMINATION_ID_LENGTH);
  }
}
