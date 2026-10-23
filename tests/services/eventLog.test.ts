import { createEventLog } from '@/services/db/eventLog';
import { createTestDb } from '../helpers/sqljsDb';

describe('eventLog', () => {
  it('remembers processed event keys', async () => {
    const log = createEventLog(await createTestDb());
    expect(log.seen('notif:rem:2026-10-22:0:DRINK')).toBe(false);
    log.mark('notif:rem:2026-10-22:0:DRINK', 1000);
    expect(log.seen('notif:rem:2026-10-22:0:DRINK')).toBe(true);
    expect(log.seen('notif:rem:2026-10-22:1:DRINK')).toBe(false);
  });

  it('marking twice is harmless', async () => {
    const log = createEventLog(await createTestDb());
    log.mark('la:abc:1', 1000);
    expect(() => log.mark('la:abc:1', 2000)).not.toThrow();
  });
});
