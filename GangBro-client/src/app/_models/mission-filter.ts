export interface MissionFilter {
    name?: string
    status?: MissionStatus
    category?: string
    exclude_chief_id?: number
    page?: number
    limit?: number
}

export type MissionStatus =
    'Open' |
    'InProgress' |
    'Completed' |
    'Failed'