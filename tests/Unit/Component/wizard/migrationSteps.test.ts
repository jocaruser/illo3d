import {
  doneCount,
  migrationDescriptionBullets,
  migrationStepStates,
  stepLabelKey,
  stepStatusKey,
} from '@/Component/wizard/migrationSteps'
import type { MigrationStepState } from '@/Store/migrationStore'

const { resolvePlanChain } = vi.hoisted(() => ({ resolvePlanChain: vi.fn() }))

vi.mock('@/Migration/registry', () => ({ resolvePlanChain }))

const chain = [
  { fromMajor: 2, toMajor: 3, toVersion: '3.0.0', steps: [{ id: 'jobs' }] },
]

const live: MigrationStepState[] = [
  { id: 'backup', status: 'done' },
  {
    id: 'jobs',
    status: 'running',
    description: 'wizard.migrationStepJobsDueDate',
  },
]

describe('stepLabelKey', () => {
  it('maps every id our plans emit', () => {
    expect(stepLabelKey('backup')).toBe('wizard.migrationEntityBackup')
    expect(stepLabelKey('audit_log')).toBe('wizard.migrationEntityAuditLog')
    expect(stepLabelKey('piece_items')).toBe('wizard.migrationEntityPieceItems')
  })

  it('returns null for an id we ship no label for', () => {
    expect(stepLabelKey('something_new')).toBeNull()
  })
})

describe('stepStatusKey', () => {
  it('maps every status', () => {
    expect(stepStatusKey('pending')).toBe('wizard.migrationStatusPending')
    expect(stepStatusKey('running')).toBe('wizard.migrationStatusRunning')
    expect(stepStatusKey('done')).toBe('wizard.migrationStatusDone')
    expect(stepStatusKey('failed')).toBe('wizard.migrationStatusFailed')
  })
})

describe('migrationStepStates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resolvePlanChain.mockReturnValue(chain)
  })

  it('seeds a pending grid from the plan chain while idle', () => {
    expect(migrationStepStates('idle', [], '2.0.0', null)).toEqual([
      { id: 'backup', status: 'pending' },
      { id: 'jobs', status: 'pending' },
    ])
  })

  it('ignores the store while idle, even if it holds stale rows', () => {
    expect(migrationStepStates('idle', live, '2.0.0', null)).toEqual([
      { id: 'backup', status: 'pending' },
      { id: 'jobs', status: 'pending' },
    ])
  })

  it('reads live rows from the store once running', () => {
    expect(migrationStepStates('migrating', live, '2.0.0', null)).toBe(live)
  })

  it('passes rows through untouched when a backup was requested', () => {
    expect(migrationStepStates('migrating', live, '2.0.0', true)).toBe(live)
  })

  it('pins the backup row to done/skipped when the user declined, while idle', () => {
    expect(migrationStepStates('idle', [], '2.0.0', false)).toEqual([
      {
        id: 'backup',
        status: 'done',
        description: 'wizard.migrationBackupSkipped',
        error: undefined,
      },
      { id: 'jobs', status: 'pending' },
    ])
  })

  it('pins the backup row to done/skipped when the user declined, while running', () => {
    const rows = migrationStepStates(
      'backing-up',
      [
        { id: 'backup', status: 'failed', error: 'copy failed' },
        ...live.slice(1),
      ],
      '2.0.0',
      false
    )
    expect(rows[0]).toEqual({
      id: 'backup',
      status: 'done',
      description: 'wizard.migrationBackupSkipped',
      error: undefined,
    })
    // Other rows are untouched.
    expect(rows[1]).toEqual(live[1])
  })
})

describe('migrationDescriptionBullets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('derives the v2→v3 bullets from a single-hop chain', () => {
    resolvePlanChain.mockReturnValue(chain)
    expect(migrationDescriptionBullets('2.0.0')).toEqual([
      {
        labelKey: 'wizard.migrationDescriptionLabelDueDates',
        itemKey: 'wizard.migrationDescriptionItemDueDates',
      },
      {
        labelKey: 'wizard.migrationDescriptionLabelColours',
        itemKey: 'wizard.migrationDescriptionItemColours',
      },
    ])
  })

  it('concatenates each hop of a chained run, in run order', () => {
    resolvePlanChain.mockReturnValue([
      { fromMajor: 1, toMajor: 2, toVersion: '2.0.0', steps: [] },
      { fromMajor: 2, toMajor: 3, toVersion: '3.0.0', steps: [] },
    ])
    expect(
      migrationDescriptionBullets('1.0.0').map((bullet) => bullet.labelKey)
    ).toEqual([
      'wizard.migrationDescriptionLabel1',
      'wizard.migrationDescriptionLabel2',
      'wizard.migrationDescriptionLabelDueDates',
      'wizard.migrationDescriptionLabelColours',
    ])
  })

  it('contributes nothing for a hop we ship no copy for', () => {
    resolvePlanChain.mockReturnValue([
      { fromMajor: 7, toMajor: 8, toVersion: '8.0.0', steps: [] },
    ])
    expect(migrationDescriptionBullets('7.0.0')).toEqual([])
  })

  it('explains nothing when the chain cannot be resolved', () => {
    resolvePlanChain.mockImplementation(() => {
      throw new Error('No migration plan found from v9')
    })
    expect(migrationDescriptionBullets('9.0.0')).toEqual([])
  })
})

describe('doneCount', () => {
  it('counts only done rows', () => {
    expect(doneCount(live)).toBe(1)
    expect(doneCount([])).toBe(0)
    expect(doneCount([{ id: 'a', status: 'failed' }])).toBe(0)
  })
})
