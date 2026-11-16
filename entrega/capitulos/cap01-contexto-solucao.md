# EnergiaJusta
### Planejamento de consumo energético doméstico por orçamento

**FIAP Global Solution 2026/2 — CitizenTech**
Turma 4ESOA | Engenharia de Software

| RM | Nome |
|---|---|
| 551986 | Gabriel Genaro Dalaqua |
| 552196 | Henrique Gagliardi Veneroso |
| 96101 | Ronaldo Felipe da Silva Amorim |
| 98205 | Paulo Henrique Figueiredo |
| 552271 | Gabriel Felipe Montoni dos Santos |

---

## 1. Contexto e solução

### 1.1 Problema e cidadão beneficiado

Famílias brasileiras com orçamento apertado recebem a conta de luz sem conseguir
identificar quais aparelhos mais pesam no valor e o que mudar para gastar menos.
Calculadoras genéricas de kWh mostram números, mas não orientam uma decisão prática:
qual aparelho reduzir, por quantas horas, sem abrir mão do que é indispensável.

A informação tarifária existe e é pública (ANEEL), mas está em formatos inacessíveis
para quem não tem familiaridade técnica. O cidadão beneficiado é qualquer morador que
precisa planejar o gasto mensal com energia e não sabe por onde começar.

### 1.2 A solução

O **EnergiaJusta** é um aplicativo mobile que recebe uma meta mensal em reais, o
catálogo de aparelhos da residência e a tarifa vigente, e entrega um plano de hábitos
calculado: quais aparelhos reduzir, por quantas horas por dia, e quanto isso representa
em reais no ciclo de 30 dias.

O que a solução entrega ao cidadão:

- **Transparência:** cada aparelho tem seu custo estimado visível, com a tarifa e as
  premissas explicitadas.
- **Respeito às restrições:** aparelhos marcados como essenciais (geladeira, equipamento
  médico) nunca aparecem nas sugestões de corte.
- **Comparação de metas:** ao gerar um plano, o app mostra automaticamente três cenários
  (meta mais exigente, sua meta, meta mais folgada), para que o cidadão entenda o que
  cada nível de esforço representa.
- **Linguagem acessível:** a IA explica o plano em linguagem simples, com orientações
  concretas de hábito em vez de repetir os números já visíveis na tela.
- **Dados reais:** a tarifa é obtida diretamente da API pública da ANEEL (Enel SP,
  B1 residencial convencional), com fallback demonstrativo identificado quando o serviço
  está indisponível.

### 1.3 ODS atendidos

| ODS | Conexão com o EnergiaJusta |
|---|---|
| **7 — Energia acessível e limpa** | Fornece informação para decisão consciente sobre consumo doméstico, sem exigir conhecimento técnico elétrico. |
| **10 — Redução das desigualdades** | Interface em português acessível, voltada a famílias com restrição orçamentária; sem coleta de CPF, renda ou dados sensíveis. |
| **12 — Consumo e produção responsáveis** | Comparação de cenários incentiva a redução de desperdício com base em dados, não em dicas genéricas. |

Os valores reportados são **estimativas calculadas** com base no consumo informado e na
tarifa selecionada. Não representam a fatura integral (sem tributos, bandeiras tarifárias
ou encargos adicionais).

### 1.4 Arquitetura geral

A solução reúne quatro componentes integrados à mesma API e ao mesmo banco de dados: o
app mobile (cidadão), o dashboard analítico (demonstração), a API REST (cálculos e IA) e
o ETL de tarifas (ingestão de dados oficiais).

> **[INSERIR: arquitetura-geral.png]**
> Exportar `diagramas/arquitetura-geral.mmd` no mermaid.live e inserir o PNG aqui.

O app mobile e o dashboard são clientes independentes da mesma API. O ETL roda como
script avulso (idempotente) e não depende da API para funcionar. O Gemini é chamado
apenas pelo backend; a chave nunca trafega para o app ou para o dashboard.
