import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MissionService } from './mission-service';
import { MissionFilter } from '../_models/mission-filter';

describe('MissionService', () => {
    let service: any;

    beforeEach(() => {
        // Mocking HttpClient and other dependencies is typically done here
        // For logic testing of createQueryString, we can use a partial mock or just test the private method if we can access it
        service = new MissionService();
        (service as any)._http = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() };
    });

    it('should create correctly formatted query strings', () => {
        const filter: MissionFilter = {
            name: 'Operation X',
            status: 'Open',
            page: 1,
            limit: 10
        };

        const queryString = (service as any).createQueryString(filter);
        expect(queryString).toContain('name=Operation%20X');
        expect(queryString).toContain('status=Open');
        expect(queryString).toContain('page=1');
        expect(queryString).toContain('limit=10');
    });

    it('should handle empty or whitespace names in filters', () => {
        const filter: MissionFilter = {
            name: '   ',
            status: 'InProgress'
        };

        const queryString = (service as any).createQueryString(filter);
        expect(queryString).not.toContain('name=');
        expect(queryString).toBe('status=InProgress');
    });
});
