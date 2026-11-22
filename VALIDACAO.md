# Validação — Fases 1 e 2

Executada em 15/11/2026, no Windows, com PostgreSQL 18 temporário real.

| Verificação                                     | Resultado                                                                                                                        |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `tsc --noEmit`                                  | Passou com TypeScript estrito                                                                                                    |
| Vitest com PostgreSQL (`npm run test:postgres`) | 23 testes passaram em 6 arquivos; nenhum ignorado                                                                                |
| Concorrência real                               | 1.000 itens criados por chamadas paralelas; 1.000 códigos distintos e sequência contínua                                         |
| Isolamento                                      | Leituras, alterações e exclusões entre duas empresas bloqueadas em categorias, itens e códigos; busca e unidades isoladas        |
| Soft delete                                     | Itens deixam de aparecer em leitura/busca; categorias com itens ativos não podem ser excluídas; restauração pelo nome verificada |
| Códigos de barras                               | EAN-13, EAN-8, UPC, códigos livres, unicidade, edição e exclusão física verificados                                              |
| Webhook                                         | Assinatura válida aceita; corpo adulterado e assinatura expirada rejeitados; associação criada/removida encaminhada ao serviço   |
| Migrations                                      | Inicial e `pg_trgm` aplicadas em uma base vazia                                                                                  |
| Seed                                            | Duas execuções: 1 empresa, 2 unidades, 5 categorias, 50 itens e 50 códigos; sem duplicação                                       |
| Build Next.js de produção                       | Compilação, checagem de tipos e geração de rotas concluídas                                                                      |
| `npm audit` após ajustes                        | Nenhuma vulnerabilidade reportada                                                                                                |
| Ícones PWA                                      | PNGs 192×192 e 512×512 confirmados; ícone inspecionado visualmente                                                               |

Na primeira tentativa, npm e o download do engine Prisma foram bloqueados pela rede do sandbox. Após autorização, a instalação e geração funcionaram. Vitest também precisou de execução autorizada porque o esbuild não conseguia ler diretórios ancestrais. As primeiras etapas avançaram durante a instalação e não têm snapshots de testes independentes; a suíte final valida o conjunto completo. A primeira compilação sem chaves Clerk tentou pré-renderizar o provider; o layout dinâmico resolveu a dependência de credenciais durante o build, sem desabilitar autenticação.

Há avisos não bloqueantes de depreciação da configuração de seed do Prisma 6 e de carregamento futuro de configuração do Vite. As versões são fixadas pelo `package-lock.json`.

## Limites

- Não foram fornecidas chaves de uma aplicação Clerk. O fluxo real de login, as chamadas à API de associações e a entrega remota de webhooks precisam de teste no ambiente configurado. Os testes locais de webhook usam assinaturas Svix reais com segredo exclusivo de teste e serviços simulados; integração de cadastros usa banco real.
- O teste de busca abaixo de 300 ms passou no serviço aquecido do PostgreSQL local. Não equivale a uma medição do endpoint em Neon/Vercel, que inclui chamadas ao Clerk e latência de rede.
- O layout responsivo e os alvos principais de toque foram implementados; não houve sessão autenticada de navegador nem teste em aparelho físico. Instalação PWA requer verificação em navegador compatível, HTTPS e ambiente Clerk configurado.
- Nenhum deploy foi realizado; o projeto está preparado para Vercel conforme o README.

## Fase 2 — resultado consolidado

Verificação realizada em 15/11/2026 com Node.js 26.3.0, Next.js 15.5.29 e PostgreSQL 18 real temporário. O `.env` do usuário foi preservado. O banco configurado pelo usuário não foi migrado automaticamente.

| Verificação            | Resultado                                                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| TypeScript estrito     | `tsc --noEmit` passou                                                                                                                                  |
| Suíte completa         | 39 testes passaram em 14 arquivos, sem ignorados no runner PostgreSQL                                                                                  |
| Migrations             | Três migrations aplicadas em base vazia, incluindo tabelas/índices da Fase 2 e CHECK de QR                                                             |
| Hierarquia             | CRUD dos quatro níveis, códigos gerados, metadados editados e exclusão lógica conferidos                                                               |
| Concorrência           | 50 posições paralelas no mesmo pai sem repetir código; regressão de 1.000 itens paralelos preservada                                                   |
| Não reutilização       | Ordem de posição excluída não é reutilizada; código de seção excluída é reservado                                                                      |
| Lote atômico           | Limite validado; conflito durante criação de posições reverte também as prateleiras criadas antes da falha                                             |
| Alocações              | Múltiplas posições por item e itens por posição; duplicação impedida; seção agrega sem repetir itens; bloqueio de exclusão e remoção física conferidos |
| Isolamento             | Outra empresa não lê, altera, exclui, aloca, resolve token, obtém imagem ou imprime dados da empresa original                                          |
| Unidade                | Cookie de outra empresa rejeitado; consultas por unidade isoladas; QR de outra unidade da mesma empresa resolve com contexto do alvo                   |
| QR                     | Token aleatório base64url/128 bits, URL, geração idempotente, regeneração, exclusão e restauração com token novo conferidos                            |
| CHECK de QR            | Inserções sem alvo, com dois alvos ou tipo incompatível rejeitadas no PostgreSQL                                                                       |
| Scanner                | Reconhecimento de origem e destino interno testado; código exato não usa busca por nome; formatos livres preservados                                   |
| PDFs autorizados       | A4, térmica e ficha gerados no serviço com papel ESTOQUISTA; outra empresa e seleção acima de 200 rejeitadas                                           |
| Seed idempotente       | Duas execuções: 2 seções, 6 módulos, 24 prateleiras, 144 posições, 8 QRs e 20 alocações, além dos dados da Fase 1                                      |
| Build                  | `next build` concluiu com todas as novas rotas                                                                                                         |
| PDFs visuais           | A4 210×297 mm, térmica 50×30 mm; ficha paginada com cabeçalho e rodapé; textos longos e acentos inspecionados                                          |
| Leitura do QR impresso | URL da amostra térmica decodificada com ZXing a partir da renderização do PDF em 203 dpi                                                               |

As sete etapas tiveram chamadas de TypeScript e Vitest. Etapas iniciais executaram a suíte unitária, com integrações explicitamente ignoradas sem `TEST_DATABASE_URL`; as rodadas completas usaram `npm run test:postgres`, que cria uma base real e isolada. Um conflito de tipos na união de resultados de busca foi corrigido. O primeiro teste PDF revelou JSX preservado no Vitest; a transformação explícita corrigiu a execução. A amostra com código longo revelou hifenização e, após desabilitá-la, truncamento; quebras explícitas nos separadores originais corrigiram ambos, confirmadas por extração de texto e renderização.

As amostras em `output/pdf/` são fictícias: duas páginas A4 com 25 etiquetas, duas páginas térmicas e uma ficha de cinco páginas com 70 itens. Foram renderizadas com PyMuPDF para inspeção; as dependências de conferência ficam somente na pasta temporária ignorada, fora do runtime da aplicação. A impressora física não foi testada.

### Limites ainda externos à validação local

- Não houve autenticação interativa no Clerk, teste de retorno pós-login em celular ou sessão visual autenticada das novas telas.
- A câmera traseira, as mensagens de permissão do navegador e a instalação PWA precisam de teste físico com origem HTTPS configurada. As rotinas de reconhecimento e consulta exata foram testadas automaticamente.
- A origem real de `NEXT_PUBLIC_APP_URL` precisa ser configurada antes de gerar etiquetas utilizáveis no celular. As amostras usam domínio reservado e não apontam para dados reais.
- Migrations e deploy no Neon/Vercel do usuário não foram executados. A latência real depende desse ambiente; o teste de busca aquecida local abaixo de 300 ms continua passando.

## Fase 3 — Estoque e movimentações

Validação local em 22/11/2026 com PostgreSQL 18 temporário e a suíte Vitest das três fases.

| Cenário | Verificação |
| --- | --- |
| TypeScript e Vitest | `tsc --noEmit` passou. 69 testes passaram em 21 arquivos no PostgreSQL real. |
| Build | `npm run build` concluiu com as rotas de estoque, movimentações, motivos e fotos. |
| Migration | Quatro migrations aplicadas a um banco vazio. Os testes fazem inserções inválidas para verificar os CHECKs e a unicidade parcial. |
| Concorrência | 100 saídas sobre saldo 60 produzem 60 sucessos, 40 conflitos e saldo final zero. 50 entradas simultâneas no balde sem posição geram uma linha. Transferências cruzadas e 10 retries da mesma chave são exercitados em paralelo. |
| Atomicidade | A falha do débito reverte um crédito executado antes dele na transferência. A remoção de alocação e a exclusão de item verificam saldo positivo, incluindo o saldo de outra unidade na exclusão. |
| Estorno | Os seis tipos originais são invertidos. A suíte cobre estornos concorrentes da mesma origem, estorno de estorno, autorização e déficit com posição e saldo atualizado. |
| Quebras e fotos | Motivo obrigatório, inativo, excluído e de outra empresa. Metadados do ImageKit simulados em testes com PostgreSQL real, cobrindo configuração ausente, formato, tamanho, vínculo e recuperação idempotente. |
| Isolamento | Empresas distintas não compartilham histórico, saldos, motivos, fotos ou resultados de idempotência. Posições e movimentações de outra unidade são rejeitadas no lançamento e no estorno. |
| Seed e reconciliação | Duas execuções mantêm 45 movimentos e 7 motivos. A reconciliação do seed e de uma sequência mista testada retorna zero divergências. |
| Ficha | A ficha de posição usa a quantidade registrada. O teste renderiza o PDF com os dados do PostgreSQL. |

A tentativa de usar o Neon configurado neste ambiente encontrou uma falha de conexão. O runner local usou um banco descartável e a migration do ambiente Neon ficou pendente. A câmera em celular físico e o envio para uma conta real do ImageKit exigem validação no ambiente com Clerk, HTTPS e credenciais do provedor.
