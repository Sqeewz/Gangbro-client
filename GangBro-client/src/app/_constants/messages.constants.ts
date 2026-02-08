export const MISSION_MESSAGES = {
    ABANDON: {
        title: 'ABANDON MISSION',
        message: 'Are you sure you want to leave this mission?',
        confirmText: 'LEAVE',
        type: 'danger' as const
    },
    START: {
        title: 'START OPERATION',
        message: 'Begin this mission and notify the crew?',
        confirmText: 'EXECUTE',
        type: 'info' as const
    },
    COMPLETE: {
        title: 'MISSION SUCCESS',
        message: 'Has the objective been fully achieved?',
        confirmText: 'COMPLETE',
        type: 'info' as const
    },
    FAIL: {
        title: 'MISSION FAILURE',
        message: 'Mark this mission as failed? This will be logged.',
        confirmText: 'FAIL',
        type: 'danger' as const
    },
    DELETE: {
        title: 'TERMINATE MISSION',
        message: 'Delete this mission? This action cannot be undone.',
        confirmText: 'DELETE',
        type: 'danger' as const
    }
};
