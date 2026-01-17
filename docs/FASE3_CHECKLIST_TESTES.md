# FASE 3 - CHECKLIST DE TESTES
## Dashboards e Analytics

**Data:** ___/___/______
**Testador:** _______________________
**Ambiente:** [ ] Local [ ] Staging [ ] Produção

---

## SPRINT 3.1 - DASHBOARD DO ALUNO

### Pré-requisitos de Teste
- [ ] Usuário ALUNO cadastrado e logado
- [ ] Pelo menos 5 provas realizadas (com notas variadas)
- [ ] Pelo menos 2 categorias diferentes de simulados
- [ ] Pelo menos 1 prova pendente disponível
- [ ] Questões com tags cadastradas

---

### 1. ACESSO E NAVEGAÇÃO

| # | Teste | Esperado | OK | Falha | Obs |
|---|-------|----------|:--:|:-----:|-----|
| 1.1 | Acessar `/aluno/dashboard` logado como ALUNO | Página carrega sem erros | [ ] | [ ] | |
| 1.2 | Acessar `/aluno/dashboard` sem login | Redireciona para `/login` | [ ] | [ ] | |
| 1.3 | Acessar `/aluno/dashboard` como DOCENTE | Acesso negado ou redirecionamento | [ ] | [ ] | |
| 1.4 | Verificar mensagem de boas-vindas | Exibe "Olá, [Nome do usuário]!" | [ ] | [ ] | |

---

### 2. CARDS DE RESUMO (4 métricas)

| # | Teste | Esperado | OK | Falha | Obs |
|---|-------|----------|:--:|:-----:|-----|
| 2.1 | Card "Nota Média" | Exibe média correta das notas | [ ] | [ ] | |
| 2.2 | Card "Total de Provas" | Exibe quantidade correta | [ ] | [ ] | |
| 2.3 | Card "Taxa de Aprovação" | Percentual correto (aprovados/total) | [ ] | [ ] | |
| 2.4 | Card "Streak" | Exibe dias consecutivos com atividade | [ ] | [ ] | |
| 2.5 | Indicador de variação (↑↓) | Mostra comparação vs mês anterior | [ ] | [ ] | |
| 2.6 | Loading state | Skeleton aparece enquanto carrega | [ ] | [ ] | |

**Cálculos para validar:**
- Nota Média = Soma das notas / Total de provas
- Taxa Aprovação = (Provas com nota >= mínima / Total) × 100
- Streak = Dias consecutivos com pelo menos 1 prova realizada

---

### 3. GRÁFICO: EVOLUÇÃO DAS NOTAS (Linha)

| # | Teste | Esperado | OK | Falha | Obs |
|---|-------|----------|:--:|:-----:|-----|
| 3.1 | Gráfico renderiza | LineChart exibido corretamente | [ ] | [ ] | |
| 3.2 | Eixo X | Datas das últimas 15-20 provas | [ ] | [ ] | |
| 3.3 | Eixo Y | Notas de 0 a 100 | [ ] | [ ] | |
| 3.4 | Linha de referência | Linha em 70% (nota mínima) | [ ] | [ ] | |
| 3.5 | Tooltip ao passar mouse | Mostra: nome da prova, data, nota | [ ] | [ ] | |
| 3.6 | Sem dados | Mensagem "Nenhum dado disponível" | [ ] | [ ] | |
| 3.7 | Loading state | Skeleton do gráfico | [ ] | [ ] | |

---

### 4. GRÁFICO: DESEMPENHO POR CATEGORIA (Barras)

| # | Teste | Esperado | OK | Falha | Obs |
|---|-------|----------|:--:|:-----:|-----|
| 4.1 | Gráfico renderiza | BarChart exibido corretamente | [ ] | [ ] | |
| 4.2 | Eixo X | Categorias (Cisco, AWS, etc.) | [ ] | [ ] | |
| 4.3 | Eixo Y | Taxa de acerto (0-100%) | [ ] | [ ] | |
| 4.4 | Cor verde | Categorias com >70% de acerto | [ ] | [ ] | |
| 4.5 | Cor amarela | Categorias com 50-70% de acerto | [ ] | [ ] | |
| 4.6 | Cor vermelha | Categorias com <50% de acerto | [ ] | [ ] | |
| 4.7 | Tooltip | Mostra categoria e percentual | [ ] | [ ] | |

---

### 5. GRÁFICO: PONTOS FORTES E FRACOS (Radar)

| # | Teste | Esperado | OK | Falha | Obs |
|---|-------|----------|:--:|:-----:|-----|
| 5.1 | Gráfico renderiza | RadarChart exibido | [ ] | [ ] | |
| 5.2 | Eixos | Tags/tópicos mais frequentes | [ ] | [ ] | |
| 5.3 | Valores | Taxa de acerto por tag | [ ] | [ ] | |
| 5.4 | Tooltip | Mostra tag e percentual | [ ] | [ ] | |
| 5.5 | Poucas tags | Exibe mensagem ou oculta gráfico | [ ] | [ ] | |

---

### 6. LISTA: PROVAS PENDENTES

| # | Teste | Esperado | OK | Falha | Obs |
|---|-------|----------|:--:|:-----:|-----|
| 6.1 | Lista renderiza | Máximo 5 provas pendentes | [ ] | [ ] | |
| 6.2 | Informações exibidas | Nome, turma, prazo, tentativas restantes | [ ] | [ ] | |
| 6.3 | Botão "Iniciar" | Redireciona para página da prova | [ ] | [ ] | |
| 6.4 | Link "Ver todas" | Redireciona para `/aluno/provas` | [ ] | [ ] | |
| 6.5 | Indicador de urgência | Destaque quando prazo < 2 dias | [ ] | [ ] | |
| 6.6 | Sem provas pendentes | Mensagem apropriada | [ ] | [ ] | |

---

### 7. LISTA: ÚLTIMAS PROVAS REALIZADAS

| # | Teste | Esperado | OK | Falha | Obs |
|---|-------|----------|:--:|:-----:|-----|
| 7.1 | Lista renderiza | Máximo 5 últimas provas | [ ] | [ ] | |
| 7.2 | Informações exibidas | Nome, data, nota | [ ] | [ ] | |
| 7.3 | Badge Aprovado | Verde quando nota >= mínima | [ ] | [ ] | |
| 7.4 | Badge Reprovado | Vermelho quando nota < mínima | [ ] | [ ] | |
| 7.5 | Link "Ver histórico" | Redireciona para `/aluno/historico` | [ ] | [ ] | |
| 7.6 | Clique na prova | Redireciona para resultado | [ ] | [ ] | |

---

### 8. SEÇÃO: QUESTÕES PARA REVISAR

| # | Teste | Esperado | OK | Falha | Obs |
|---|-------|----------|:--:|:-----:|-----|
| 8.1 | Lista renderiza | Top 5 questões mais erradas | [ ] | [ ] | |
| 8.2 | Informações | Enunciado resumido, simulado, categoria | [ ] | [ ] | |
| 8.3 | Contador de erros | "Errada X vezes" | [ ] | [ ] | |
| 8.4 | Botão "Revisar" | Abre modal com questão completa | [ ] | [ ] | |
| 8.5 | Modal de revisão | Exibe enunciado completo e explicação | [ ] | [ ] | |
| 8.6 | Sem questões erradas | Mensagem de parabéns | [ ] | [ ] | |

---

### 9. WIDGET: STREAK E GAMIFICAÇÃO

| # | Teste | Esperado | OK | Falha | Obs |
|---|-------|----------|:--:|:-----:|-----|
| 9.1 | Streak exibido | Dias consecutivos com ícone 🔥 | [ ] | [ ] | |
| 9.2 | Barra de XP | Progress bar para próximo nível | [ ] | [ ] | |
| 9.3 | Última conquista | Exibe se houver | [ ] | [ ] | |
| 9.4 | Link conquistas | Redireciona para `/aluno/conquistas` | [ ] | [ ] | |

---

### 10. RESPONSIVIDADE - DASHBOARD ALUNO

| # | Teste | Esperado | OK | Falha | Obs |
|---|-------|----------|:--:|:-----:|-----|
| 10.1 | Mobile (<768px) | 1 coluna, cards empilhados | [ ] | [ ] | |
| 10.2 | Tablet (768-1024px) | 2 colunas | [ ] | [ ] | |
| 10.3 | Desktop (>1024px) | 3 colunas stats, 2 para gráficos | [ ] | [ ] | |
| 10.4 | Gráficos em mobile | Redimensionam corretamente | [ ] | [ ] | |

---

### 11. APIs DO DASHBOARD ALUNO

| # | Endpoint | Teste | OK | Falha | Obs |
|---|----------|-------|:--:|:-----:|-----|
| 11.1 | GET `/api/aluno/dashboard/resumo` | Retorna métricas corretas | [ ] | [ ] | |
| 11.2 | GET `/api/aluno/dashboard/evolucao` | Retorna array de provas | [ ] | [ ] | |
| 11.3 | GET `/api/aluno/dashboard/categorias` | Retorna taxas por categoria | [ ] | [ ] | |
| 11.4 | GET `/api/aluno/dashboard/tags` | Retorna taxas por tag | [ ] | [ ] | |
| 11.5 | GET `/api/aluno/dashboard/provas-pendentes` | Retorna até 5 provas | [ ] | [ ] | |
| 11.6 | GET `/api/aluno/dashboard/ultimas-provas` | Retorna até 5 provas | [ ] | [ ] | |
| 11.7 | GET `/api/aluno/dashboard/questoes-revisar` | Retorna questões erradas | [ ] | [ ] | |
| 11.8 | Todas APIs sem auth | Retornam 401 Unauthorized | [ ] | [ ] | |

---

## SPRINT 3.2 - DASHBOARD DO DOCENTE

### Pré-requisitos de Teste
- [ ] Usuário DOCENTE cadastrado e logado
- [ ] Pelo menos 2 simulados criados
- [ ] Pelo menos 2 turmas com alunos
- [ ] Pelo menos 10 provas realizadas por alunos
- [ ] Algumas questões com alto índice de erro

---

### 12. ACESSO E NAVEGAÇÃO

| # | Teste | Esperado | OK | Falha | Obs |
|---|-------|----------|:--:|:-----:|-----|
| 12.1 | Acessar `/docente/dashboard` como DOCENTE | Página carrega sem erros | [ ] | [ ] | |
| 12.2 | Acessar `/docente/dashboard` como ALUNO | Acesso negado | [ ] | [ ] | |
| 12.3 | Acessar como SUPERADMIN | Acesso permitido | [ ] | [ ] | |

---

### 13. SELETOR DE PERÍODO

| # | Teste | Esperado | OK | Falha | Obs |
|---|-------|----------|:--:|:-----:|-----|
| 13.1 | Botão "7 dias" | Filtra dados dos últimos 7 dias | [ ] | [ ] | |
| 13.2 | Botão "30 dias" | Filtra dados dos últimos 30 dias | [ ] | [ ] | |
| 13.3 | Botão "3 meses" | Filtra dados dos últimos 90 dias | [ ] | [ ] | |
| 13.4 | Botão "Todos" | Exibe todos os dados | [ ] | [ ] | |
| 13.5 | Mudança de período | Todos os gráficos atualizam | [ ] | [ ] | |

---

### 14. FILTROS (Turma/Simulado)

| # | Teste | Esperado | OK | Falha | Obs |
|---|-------|----------|:--:|:-----:|-----|
| 14.1 | Dropdown turma | Lista turmas do docente | [ ] | [ ] | |
| 14.2 | Filtrar por turma | Dados filtrados corretamente | [ ] | [ ] | |
| 14.3 | Dropdown simulado | Lista simulados do docente | [ ] | [ ] | |
| 14.4 | Filtrar por simulado | Dados filtrados corretamente | [ ] | [ ] | |
| 14.5 | Limpar filtros | Restaura visão completa | [ ] | [ ] | |
| 14.6 | Combinação de filtros | Turma + Simulado juntos | [ ] | [ ] | |

---

### 15. CARDS DE RESUMO DOCENTE

| # | Teste | Esperado | OK | Falha | Obs |
|---|-------|----------|:--:|:-----:|-----|
| 15.1 | Card "Alunos Ativos" | Conta alunos com atividade no período | [ ] | [ ] | |
| 15.2 | Card "Provas Realizadas" | Total de provas no período | [ ] | [ ] | |
| 15.3 | Card "Média Geral" | Média das notas no período | [ ] | [ ] | |
| 15.4 | Card "Taxa Aprovação" | Percentual de aprovações | [ ] | [ ] | |
| 15.5 | Cards atualizam com filtros | Valores mudam ao filtrar | [ ] | [ ] | |

---

### 16. GRÁFICO: PROVAS REALIZADAS POR DIA (Área)

| # | Teste | Esperado | OK | Falha | Obs |
|---|-------|----------|:--:|:-----:|-----|
| 16.1 | Gráfico renderiza | AreaChart exibido | [ ] | [ ] | |
| 16.2 | Eixo X | Datas do período selecionado | [ ] | [ ] | |
| 16.3 | Eixo Y | Quantidade de provas | [ ] | [ ] | |
| 16.4 | Área preenchida | Gradiente visível | [ ] | [ ] | |
| 16.5 | Tooltip | Data e quantidade | [ ] | [ ] | |
| 16.6 | Período sem dados | Exibe zeros nos dias | [ ] | [ ] | |

---

### 17. GRÁFICO: MÉDIA POR SIMULADO (Barras Horizontais)

| # | Teste | Esperado | OK | Falha | Obs |
|---|-------|----------|:--:|:-----:|-----|
| 17.1 | Gráfico renderiza | Barras horizontais | [ ] | [ ] | |
| 17.2 | Ordenação | Maior para menor média | [ ] | [ ] | |
| 17.3 | Cor verde | Simulados com média >70 | [ ] | [ ] | |
| 17.4 | Cor vermelha | Simulados com média <70 | [ ] | [ ] | |
| 17.5 | Tooltip | Nome do simulado, média, total provas | [ ] | [ ] | |
| 17.6 | Nomes longos | Truncados adequadamente | [ ] | [ ] | |

---

### 18. GRÁFICO: DISTRIBUIÇÃO DE NOTAS (Pizza/Donut)

| # | Teste | Esperado | OK | Falha | Obs |
|---|-------|----------|:--:|:-----:|-----|
| 18.1 | Gráfico renderiza | PieChart tipo donut | [ ] | [ ] | |
| 18.2 | Faixa 0-50% | Cor e percentual corretos | [ ] | [ ] | |
| 18.3 | Faixa 51-70% | Cor e percentual corretos | [ ] | [ ] | |
| 18.4 | Faixa 71-85% | Cor e percentual corretos | [ ] | [ ] | |
| 18.5 | Faixa 86-100% | Cor e percentual corretos | [ ] | [ ] | |
| 18.6 | Tooltip | Faixa e quantidade | [ ] | [ ] | |
| 18.7 | Legenda | Exibida abaixo do gráfico | [ ] | [ ] | |

---

### 19. TABELA: RANKING DE ALUNOS

| # | Teste | Esperado | OK | Falha | Obs |
|---|-------|----------|:--:|:-----:|-----|
| 19.1 | Tabela renderiza | Colunas corretas | [ ] | [ ] | |
| 19.2 | Colunas exibidas | Posição, Avatar, Nome, Média, Provas, Taxa | [ ] | [ ] | |
| 19.3 | Ordenação padrão | Por nota média (maior primeiro) | [ ] | [ ] | |
| 19.4 | Paginação | 10 por página, navegação funciona | [ ] | [ ] | |
| 19.5 | Busca por nome | Filtra alunos corretamente | [ ] | [ ] | |
| 19.6 | Top 3 destacado | Ícones ouro/prata/bronze | [ ] | [ ] | |
| 19.7 | Cores por desempenho | Verde >=70, Amarelo 50-70, Vermelho <50 | [ ] | [ ] | |
| 19.8 | Seletor de limite | 10/25/50 funcionando | [ ] | [ ] | |

---

### 20. LISTA: QUESTÕES PROBLEMÁTICAS

| # | Teste | Esperado | OK | Falha | Obs |
|---|-------|----------|:--:|:-----:|-----|
| 20.1 | Lista renderiza | Top 10 questões com mais erros | [ ] | [ ] | |
| 20.2 | Informações | Simulado, enunciado, % erro, vezes respondida | [ ] | [ ] | |
| 20.3 | Ordenação | Maior taxa de erro primeiro | [ ] | [ ] | |
| 20.4 | Link para editar | Redireciona para edição da questão | [ ] | [ ] | |
| 20.5 | Sem questões problemáticas | Mensagem apropriada | [ ] | [ ] | |

---

### 21. CARD DE ALERTAS

| # | Teste | Esperado | OK | Falha | Obs |
|---|-------|----------|:--:|:-----:|-----|
| 21.1 | Alerta alunos inativos | Lista alunos >7 dias sem atividade | [ ] | [ ] | |
| 21.2 | Alerta baixa aprovação | Provas com <30% aprovação | [ ] | [ ] | |
| 21.3 | Alerta simulados não publicados | Lista se houver | [ ] | [ ] | |
| 21.4 | Cores dos alertas | Amarelo/Vermelho/Azul conforme tipo | [ ] | [ ] | |
| 21.5 | Sem alertas | Mensagem "Tudo em ordem!" | [ ] | [ ] | |
| 21.6 | Links de ação | Redirecionam corretamente | [ ] | [ ] | |

---

### 22. EXPORTAÇÃO PDF

| # | Teste | Esperado | OK | Falha | Obs |
|---|-------|----------|:--:|:-----:|-----|
| 22.1 | Botão "Exportar PDF" | Abre dropdown/inicia download | [ ] | [ ] | |
| 22.2 | Cabeçalho do PDF | Título, data de geração | [ ] | [ ] | |
| 22.3 | Resumo das métricas | 4 cards exportados | [ ] | [ ] | |
| 22.4 | Tabela de ranking | Top 20 alunos | [ ] | [ ] | |
| 22.5 | Questões problemáticas | Lista exportada | [ ] | [ ] | |
| 22.6 | Rodapé | Número da página | [ ] | [ ] | |
| 22.7 | Arquivo válido | PDF abre corretamente | [ ] | [ ] | |

---

### 23. EXPORTAÇÃO EXCEL

| # | Teste | Esperado | OK | Falha | Obs |
|---|-------|----------|:--:|:-----:|-----|
| 23.1 | Botão "Exportar Excel" | Inicia download do .xlsx | [ ] | [ ] | |
| 23.2 | Aba "Resumo" | Métricas gerais | [ ] | [ ] | |
| 23.3 | Aba "Ranking" | Todos os alunos | [ ] | [ ] | |
| 23.4 | Aba "Realizações" | Dados diários | [ ] | [ ] | |
| 23.5 | Aba "Questões" | Questões problemáticas | [ ] | [ ] | |
| 23.6 | Formatação | Datas em pt-BR | [ ] | [ ] | |
| 23.7 | Arquivo válido | Excel abre corretamente | [ ] | [ ] | |

---

### 24. RESPONSIVIDADE - DASHBOARD DOCENTE

| # | Teste | Esperado | OK | Falha | Obs |
|---|-------|----------|:--:|:-----:|-----|
| 24.1 | Mobile (<768px) | Layout adaptado, scrollable | [ ] | [ ] | |
| 24.2 | Tablet (768-1024px) | 2 colunas | [ ] | [ ] | |
| 24.3 | Desktop (>1024px) | Layout completo | [ ] | [ ] | |
| 24.4 | Tabela em mobile | Scroll horizontal | [ ] | [ ] | |
| 24.5 | Filtros em mobile | Collapsible ou stack | [ ] | [ ] | |

---

### 25. APIs DO DASHBOARD DOCENTE

| # | Endpoint | Teste | OK | Falha | Obs |
|---|----------|-------|:--:|:-----:|-----|
| 25.1 | GET `/api/docente/dashboard/resumo` | Retorna métricas | [ ] | [ ] | |
| 25.2 | GET `/api/docente/dashboard/realizacoes` | Retorna array por dia | [ ] | [ ] | |
| 25.3 | GET `/api/docente/dashboard/medias-simulados` | Retorna médias | [ ] | [ ] | |
| 25.4 | GET `/api/docente/dashboard/distribuicao` | Retorna faixas | [ ] | [ ] | |
| 25.5 | GET `/api/docente/dashboard/ranking` | Retorna paginado | [ ] | [ ] | |
| 25.6 | GET `/api/docente/dashboard/questoes-problematicas` | Retorna lista | [ ] | [ ] | |
| 25.7 | GET `/api/docente/dashboard/alertas` | Retorna alertas | [ ] | [ ] | |
| 25.8 | APIs com filtro `periodo` | Filtra corretamente | [ ] | [ ] | |
| 25.9 | APIs com filtro `turmaId` | Filtra corretamente | [ ] | [ ] | |
| 25.10 | APIs com filtro `simuladoId` | Filtra corretamente | [ ] | [ ] | |
| 25.11 | Todas APIs sem auth | Retornam 401 | [ ] | [ ] | |
| 25.12 | APIs como ALUNO | Retornam 403 | [ ] | [ ] | |

---

## TESTES DE PERFORMANCE

| # | Teste | Esperado | OK | Falha | Obs |
|---|-------|----------|:--:|:-----:|-----|
| P1 | Carregamento inicial aluno | < 3 segundos | [ ] | [ ] | |
| P2 | Carregamento inicial docente | < 3 segundos | [ ] | [ ] | |
| P3 | Mudança de filtro | < 1 segundo | [ ] | [ ] | |
| P4 | Geração PDF | < 5 segundos | [ ] | [ ] | |
| P5 | Geração Excel | < 5 segundos | [ ] | [ ] | |
| P6 | Cache funcionando | Requests não duplicam | [ ] | [ ] | |

---

## TESTES DE ERRO

| # | Teste | Esperado | OK | Falha | Obs |
|---|-------|----------|:--:|:-----:|-----|
| E1 | API retorna erro 500 | Mensagem amigável exibida | [ ] | [ ] | |
| E2 | Conexão lenta | Loading states visíveis | [ ] | [ ] | |
| E3 | Sem dados no período | Mensagens apropriadas | [ ] | [ ] | |
| E4 | Token expirado | Redireciona para login | [ ] | [ ] | |

---

## RESUMO DA EXECUÇÃO

### Sprint 3.1 - Dashboard Aluno
- **Total de testes:** 67
- **Aprovados:** ___
- **Reprovados:** ___
- **Não testados:** ___

### Sprint 3.2 - Dashboard Docente
- **Total de testes:** 85
- **Aprovados:** ___
- **Reprovados:** ___
- **Não testados:** ___

### Observações Gerais:
```
[Espaço para anotações]
```

### Bugs Encontrados:
| # | Descrição | Severidade | Status |
|---|-----------|------------|--------|
| 1 | | [ ] Alta [ ] Média [ ] Baixa | [ ] Aberto [ ] Corrigido |
| 2 | | [ ] Alta [ ] Média [ ] Baixa | [ ] Aberto [ ] Corrigido |
| 3 | | [ ] Alta [ ] Média [ ] Baixa | [ ] Aberto [ ] Corrigido |

---

### Aprovação Final

| Critério | Status |
|----------|--------|
| Todas funcionalidades implementadas | [ ] Sim [ ] Não |
| Sem bugs de alta severidade | [ ] Sim [ ] Não |
| Performance adequada | [ ] Sim [ ] Não |
| Responsivo mobile/desktop | [ ] Sim [ ] Não |

**FASE 3 APROVADA:** [ ] SIM [ ] NÃO

**Assinatura:** _______________________
**Data:** ___/___/______
