import { describe, expect, it } from 'vitest';
import { ConsumableRepository } from './repository';

describe('ConsumableRepository', () => {
  it('instantiates correctly and provides load method', () => {
    const repo = new ConsumableRepository();
    expect(repo).toBeDefined();
    expect(typeof repo.load).toBe('function');
    expect(typeof repo.create).toBe('function');
    expect(typeof repo.update).toBe('function');
    expect(typeof repo.remove).toBe('function');
  });
});
