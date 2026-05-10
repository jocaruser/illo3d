// TODO: Rewrite for piece-based kanban in v2.0.0
// This file is temporarily stubbed to allow compilation

export function kanbanStatusChangeNeedsDialog(): boolean {
  return false
}

export function applyKanbanDrop(): Promise<'needs-dialog' | 'applied'> {
  return Promise.resolve('applied')
}

export function applyKanbanBoardOrderAfterStatusCommit(): void {
  // No-op
}

export function clearKanbanPendingAfterSelect(): void {
  // No-op
}