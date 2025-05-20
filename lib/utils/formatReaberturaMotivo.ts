/**
 * Formata o motivo de reabertura para exibição
 * 
 * O campo motivoReabertura pode conter:
 * 1. Uma string simples com o motivo informado pelo utente
 * 2. Um JSON com metadados técnicos (como rupePath, rupeNumero)
 * 
 * Esta função extrai o motivo real ou retorna uma mensagem padrão
 */
export function formatReaberturaMotivo(motivoReabertura: string | null | undefined): string {
  if (!motivoReabertura) {
    return 'Nenhum motivo fornecido';
  }

  try {
    // Verificar se é um JSON
    const metadata = JSON.parse(motivoReabertura);
    
    // Se for um JSON, verificar se tem um campo específico para o motivo
    if (metadata.motivo) {
      return metadata.motivo;
    }
    
    // Se não tiver o campo motivo, mas for um JSON técnico (com rupePath)
    if (metadata.rupePath || metadata.rupeNumero) {
      return 'Reabertura solicitada para envio de relatório pendente';
    }
    
    // Se for um JSON sem campos reconhecidos
    return 'Motivo não especificado';
  } catch (e) {
    // Se não for um JSON, retornar o texto original
    return motivoReabertura;
  }
}
