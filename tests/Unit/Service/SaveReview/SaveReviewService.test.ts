import { findRecordById, matrixToRecords } from '@/Repository/Matrix'
import { SaveReviewService } from '@/Service/SaveReview/SaveReviewService'
import { makeEm, type TestContext } from '../helpers'

function makeService(context: TestContext): SaveReviewService {
  return new SaveReviewService(context.tabs, context.em.audit)
}

describe('SaveReviewService.revertField', () => {
  let context: TestContext

  beforeEach(() => {
    context = makeEm()
    context.tabs.seed('clients', {
      id: 'CL1',
      name: 'Acme Ltd',
      email: 'a@x.com',
    })
  })

  it('sets the column back and audit-logs the edit', () => {
    makeService(context).revertField('client', 'CL1', 'name', 'Acme')

    const row = findRecordById('clients', context.tabs.matrix('clients'), 'CL1')
    expect(row?.name).toBe('Acme')
    expect(row?.email).toBe('a@x.com')

    const log = matrixToRecords('audit_log', context.tabs.matrix('audit_log'))
    expect(log).toHaveLength(1)
    expect(log[0].entity_name).toBe('client')
    expect(log[0].entity_id).toBe('CL1')
    expect(log[0].action).toBe('update')
    expect(log[0].fieldsChanged).toBe('name')
    expect(JSON.parse(log[0].before_json)).toMatchObject({ name: 'Acme Ltd' })
    expect(JSON.parse(log[0].after_json)).toMatchObject({ name: 'Acme' })
  })

  it('does nothing when the row no longer exists', () => {
    makeService(context).revertField('client', 'CL9', 'name', 'Acme')

    expect(matrixToRecords('audit_log', context.tabs.matrix('audit_log'))).toHaveLength(0)
  })

  it('does nothing when the column already holds the value', () => {
    makeService(context).revertField('client', 'CL1', 'name', 'Acme Ltd')

    expect(matrixToRecords('audit_log', context.tabs.matrix('audit_log'))).toHaveLength(0)
    expect(
      findRecordById('clients', context.tabs.matrix('clients'), 'CL1')?.name
    ).toBe('Acme Ltd')
  })
})
