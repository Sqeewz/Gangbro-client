import { MissionStatus } from '../_enums/mission-status.enum';

export interface Mission {
    id: number,
    name: string,
    description?: string,
    status: MissionStatus,
    chief_id: number,
    chief_display_name: string,
    crew_count: number,
    created_at: Date,
    updated_at: Date,
    category: string,
}