import { z } from 'zod';
import { AgendamentoTipo, AgendamentoStatus, MetaStatus, ClienteStatus } from './enums';

export const agendamentoSchema = z.object({
  titulo: z.string().min(3, 'O título deve ter pelo menos 3 caracteres'),
  descricao: z.string().optional(),
  data_inicio: z.string().min(1, 'A data de início é obrigatória'),
  data_fim: z.string().optional().nullable(),
  tipo: z.nativeEnum(AgendamentoTipo),
  status: z.nativeEnum(AgendamentoStatus),
  meta_relacionada_id: z.string().optional().nullable(),
  google_event_id: z.string().optional().nullable(),
});

export type AgendamentoFormData = z.infer<typeof agendamentoSchema>;

export const metaSmartSchema = z.object({
  titulo: z.string().min(3, 'O título deve ter pelo menos 3 caracteres'),
  especifica: z.string().optional(),
  mensuravel: z.string().optional(),
  atingivel: z.string().optional(),
  relevante: z.string().optional(),
  temporal: z.string().optional(),
  prazo: z.string().optional(),
  status: z.nativeEnum(MetaStatus),
});

export type MetaSmartFormData = z.infer<typeof metaSmartSchema>;

export const clienteSchema = z.object({
  nome: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional(),
  status: z.nativeEnum(ClienteStatus),
});

export type ClienteFormData = z.infer<typeof clienteSchema>;

export const professionalNoteSchema = z.object({
  content: z.string().min(1, 'O conteúdo da nota não pode estar vazio'),
  color: z.enum(['yellow', 'blue', 'green', 'pink', 'purple', 'gray']).default('yellow'),
});

export type ProfessionalNoteFormData = z.infer<typeof professionalNoteSchema>;
