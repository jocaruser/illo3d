import { Client } from '@/Entity/Client'
import type { EntityManager } from '@/Repository/EntityManager'
import { isoDay } from './Clock'

export interface ClientInput {
  name: string
  email?: string
  phone?: string
  notes?: string
  preferredContact?: string
  leadSource?: string
  address?: string
}

export type ClientResult = { ok: true; client: Client } | { ok: false; error: string }

export class ClientService {
  constructor(private readonly em: EntityManager) {}

  createClient(input: ClientInput): ClientResult {
    const name = input.name.trim()
    if (name === '') return { ok: false, error: 'clients.nameRequired' }
    const client = new Client()
    client.id = this.em.clients.nextId()
    client.createdAt = isoDay(this.em.clock)
    applyFields(client, { ...input, name })
    this.em.clients.save(client)
    return { ok: true, client }
  }

  updateClient(id: string, input: ClientInput): ClientResult {
    const client = this.em.clients.find(id)
    if (client === null) return { ok: false, error: 'clientDetail.notFound' }
    const name = input.name.trim()
    if (name === '') return { ok: false, error: 'clients.nameRequired' }
    applyFields(client, { ...input, name })
    this.em.clients.save(client)
    return { ok: true, client }
  }
}

function applyFields(client: Client, input: ClientInput): void {
  client.name = input.name
  client.email = input.email ?? ''
  client.phone = input.phone ?? ''
  client.notes = input.notes ?? ''
  client.preferredContact = input.preferredContact ?? ''
  client.leadSource = input.leadSource ?? ''
  client.address = input.address ?? ''
}
