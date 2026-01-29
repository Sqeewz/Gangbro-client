export interface MissionFilter {
    name?: string
    status?: MissionStatus
    exclude_chief_id?: number
}

export type MissionStatus =
    'Open' |
    'InProgress' |
    'Completed' |
    'Failed'