import { z } from 'zod';

export const agendamentoSchema = z.object({
  titulo: z.string().min(3, 'O título deve ter pelo menos 3 caracteres'),
  descricao: z.string().optional(),
  data_inicio: z.string().min(1, 'A data de início é obrigatória'),
  data_fim: z.string().optional().nullable(),
  tipo: z.enum(['sessao', 'tarefa', 'acompanhamento', 'revisao']),
  status: z.enum(['pendente', 'em_andamento', 'concluido', 'cancelado']),
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
  status: z.enum(['a_fazer', 'em_andamento', 'concluida', 'pausada']),
});

export type MetaSmartFormData = z.infer<typeof metaSmartSchema>;

export const clienteSchema = z.object({
  nome: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional(),
  status: z.enum(['ativo', 'inativo']),
});

export type ClienteFormData = z.infer<typeof clienteSchema>;
