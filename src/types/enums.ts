export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  CLIENT = 'client',
}

export enum SessaoStatus {
  REALIZADA = 'concluido',
  PENDENTE = 'pendente',
  CANCELADA = 'cancelado',
}

export enum AgendamentoTipo {
  SESSAO = 'sessao',
  TAREFA = 'tarefa',
  ACOMPANHAMENTO = 'acompanhamento',
  REVISAO = 'revisao',
}

export enum AgendamentoStatus {
  PENDENTE = 'pendente',
  EM_ANDAMENTO = 'em_andamento',
  CONCLUIDO = 'concluido',
  CANCELADO = 'cancelado',
}

export enum MetaStatus {
  A_FAZER = 'a_fazer',
  EM_ANDAMENTO = 'em_andamento',
  CONCLUIDO = 'concluido',
  PAUSADA = 'pausada',
  PENDENTE = 'pendente',
}

export enum ClienteStatus {
  ATIVO = 'ativo',
  INATIVO = 'inativo',
}

export enum PDIStatus {
  RASCUNHO = 'rascunho',
  PENDENTE_APROVACAO = 'pendente_aprovacao',
  ATIVO = 'ativo',
  AJUSTE_SOLICITADO = 'ajuste_solicitado',
  CONCLUIDO = 'concluido',
  CANCELADO = 'cancelado',
}

export enum PDIAcaoStatus {
  PENDENTE = 'pendente',
  CONCLUIDO = 'concluido',
}

export enum PDIMetaStatus {
  NAO_INICIADO = 'nao_iniciado',
  EM_ANDAMENTO = 'em_andamento',
  CONCLUIDO = 'concluido',
}

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

export enum SentimentoType {
  FELIZ = 'feliz',
  NEUTRO = 'neutro',
  TRISTE = 'triste',
}

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
}

export enum GatewayType {
  STRIPE = 'stripe',
  MERCADOPAGO = 'mercadopago',
}

export enum TipoUsuario {
  GESTOR = 'Gestor',
  COLABORADOR = 'Colaborador',
}

export enum PlanType {
  FREE = 'free',
  PRO = 'pro',
  MASTER = 'master',
}
