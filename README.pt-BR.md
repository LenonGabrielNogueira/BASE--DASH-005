# Inventário — Fases 1 e 2

Catálogo multiempresa em português do Brasil: Next.js App Router, TypeScript estrito, PostgreSQL/Prisma, Clerk Organizations, Tailwind e componentes shadcn/ui com Radix. Formulários usam react-hook-form/zod e notificações Sonner. Deploy alvo: Vercel.

## Rodar localmente

Requisitos: Node.js 22.12+ (recomendado 24 LTS), npm e PostgreSQL com permissão para criar `pg_trgm`. Na Neon, use a conexão pooled em `DATABASE_URL` e a conexão direta em `DIRECT_URL`, ambas com TLS.

```powershell
cd inventario
npm ci
Copy-Item .env.example .env
# Preencha .env com as conexões e chaves reais.
npm run db:generate
npm run db:migrate
npm run dev
```

Abra `http://localhost:3000`. Cadastre-se, crie/selecione uma empresa e cadastre unidades, categorias e itens. O primeiro acesso provisiona Empresa e Usuario caso o webhook ainda não tenha chegado. Nunca é necessário informar `empresaId` nos formulários.

### Dados de exemplo

Opcional: após criar uma Organization, use seu ID real para conectar os dados à sua sessão:

```powershell
$env:SEED_CLERK_ORG_ID = 'org_SEU_ID_REAL'
npm run db:seed
```

Sem essa variável, o seed usa `org_exemplo_desenvolvimento`, que não corresponde a uma conta real. São criados uma empresa, duas unidades, cinco categorias e 50 itens com EAN-13 válidos. O seed não repete os dados se já houver itens nessa empresa. Execute somente em desenvolvimento.

## Clerk

1. Crie uma aplicação no painel do Clerk e habilite Organizations. Configure os métodos de entrada desejados e permita criação de Organizations para os usuários que criarão empresas.
2. Copie a publishable key para `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` e a secret key para `CLERK_SECRET_KEY`. Use as URLs `/sign-in` e `/sign-up` nas variáveis indicadas em `.env.example`. Configure os domínios locais e de produção na instância correspondente.
3. O administrador da Organization (`org:admin`) recebe ADMIN. Crie o papel personalizado `org:gerente` para GERENTE; `org:member` e outros papéis recebem ESTOQUISTA. ADMIN e GERENTE podem alterar cadastros; ESTOQUISTA somente lê. As permissões de gerenciamento de membros no Clerk são configuradas separadamente no painel do provedor.
4. Crie um endpoint de webhook apontando para `https://SEU_DOMINIO/api/webhooks/clerk`. Em desenvolvimento use um túnel HTTPS para a mesma rota local.
5. Assine `organization.created`, `organizationMembership.created` e `organizationMembership.deleted`. Copie o signing secret `whsec_…` para `CLERK_WEBHOOK_SECRET`. A assinatura Svix é verificada sobre o corpo bruto, com timestamp e ID. Eventos não utilizados são reconhecidos e ignorados.
6. Crie duas Organizations e use usuários com associações separadas para verificar visualmente o isolamento. O seletor de empresas está no cabeçalho; `/selecionar-empresa` permite listar e criar empresas.

O contexto confirma a associação atual na API do Clerk e sincroniza o papel em cada requisição. Isso cobre a revogação e mudanças de papel sem depender exclusivamente da entrega do webhook. As chaves não acompanham o repositório. O build pode ser executado sem chaves porque o layout é dinâmico; a navegação autenticada exige configuração real.

## Testes e checagens

```powershell
npm run typecheck
npm test
npm run test:postgres
npm run build
```

`npm test` executa unitários e, quando `TEST_DATABASE_URL` existe, integração. Sem banco, os testes de integração aparecem explicitamente como **skipped**, não como aprovados.

`npm run test:postgres` inicia PostgreSQL real temporário na porta 55432, aplica as duas migrations, executa toda a suíte e encerra o processo. Não usa mocks de banco e não precisa das chaves Clerk. Os binários da dependência de desenvolvimento `embedded-postgres` precisam estar disponíveis para seu sistema. A pasta `.teste-postgres/` é ignorada pelo Git e os dados locais ficam preservados para inspeção; cada execução usa uma pasta nova. A porta precisa estar livre.

Para usar uma branch de teste Neon ou PostgreSQL existente, aplique as migrations nessa base e configure `TEST_DATABASE_URL` em `.env`. Use uma base exclusiva de testes; a suíte cria empresas com prefixo `teste-` e limpa somente os registros dessas empresas.

O teste unitário cobre 50 incrementos paralelos simulados. A integração cobre **1.000 criações paralelas em transações reais**, CRUD, código imutável, soft delete, restauração de categoria, restrições de papel, isolamento de categorias/itens/códigos/unidades e prioridade da busca. O teste de desempenho exige menos de 300 ms para uma consulta de serviço aquecida no banco de teste. Isso não comprova o mesmo tempo no endpoint público: rede, região do banco, cold start e consulta ao Clerk também precisam ser medidos no ambiente de destino.

As etapas iniciais tiveram checagens bloqueadas pelo download de dependências e pela restrição local do esbuild. Depois da instalação/autorização, TypeScript, Vitest e PostgreSQL real foram executados. Consulte `VALIDACAO.md` para os resultados finais e limites de verificação.

## Publicar na Vercel

Importe o repositório e selecione `inventario` como Root Directory. Use Node.js 24, instalação `npm ci` e build `npm run build`. Configure todas as variáveis de `.env.example`, exceto `TEST_DATABASE_URL`, com valores de produção. Execute `npm run db:migrate` em um job de release com a conexão direta antes de liberar a versão. Não execute o seed em produção. Cadastre o domínio da Vercel no Clerk e configure o webhook de produção.

Migrations são versionadas: `000_inicial` cria tabelas/índices do schema e `000_pg_trgm` habilita a extensão e o índice GIN de `Item.nome`.

## Aceite

- [x] Contexto de empresa derivado da sessão Clerk; cadastros não aceitam empresa do cliente.
- [x] Serviços isolam leituras e escritas entre empresas, incluindo relações e busca.
- [x] Código sequencial transacional e imutável; teste real de 1.000 itens concorrentes.
- [x] Categorias e itens com soft delete; categoria com itens ativos impede exclusão.
- [x] Vários códigos por item, unicidade por empresa, EAN-13/EAN-8/UPC com dígito verificador.
- [x] Busca com prioridade, limite de 20, debounce de 300 ms e índice pg_trgm.
- [x] Layout mobile-first, cards responsivos, navegação inferior, alvos principais de 44 px e estados de carregamento/vazio/erro.
- [x] Manifest, theme-color e ícones PNG 192/512; sem service worker offline.
- [ ] Aceitar login, seleção de empresas e webhook com as chaves Clerk do ambiente de destino.
- [ ] Conferir telas em aparelho real e instalação PWA em navegador compatível com HTTPS.
- [ ] Medir endpoint `/api/busca` em produção e confirmar a meta de 300 ms com volume e região reais.

As decisões de domínio e simplificações estão em [DECISOES.md](DECISOES.md).

## Fase 2 — Localização e QR Code

### Atualizar uma instalação existente

```powershell
cd inventario
npm ci
npm run db:generate
# Configure NEXT_PUBLIC_APP_URL no .env antes de iniciar.
npm run db:migrate
npm run dev
```

`NEXT_PUBLIC_APP_URL` deve conter a origem pública estável do sistema, por exemplo `http://localhost:3000` em desenvolvimento ou sua origem HTTPS de produção. Os QRs contêm essa origem seguida de `/q/<token>`. Depois de mudar variáveis públicas, reinicie o servidor de desenvolvimento ou gere um novo build. O `.env` existente foi preservado. As migrations foram verificadas no PostgreSQL temporário; a migration da sua conexão Neon deve ser aplicada pelo comando acima, no ambiente apropriado.

A migration `202611160001_fase2_localizacao` adiciona os seis modelos, relações, índices de busca por nome e o CHECK que exige exatamente um alvo do QR correspondente ao seu tipo. Não há alteração destrutiva nos cadastros anteriores.

### Fluxo de uso

1. Escolha a empresa no Clerk e a unidade no cabeçalho. A escolha de unidade fica em cookie HttpOnly e é validada contra a empresa e a situação ativa. Sem cookie, a primeira unidade ativa por nome é utilizada. Um cookie de outra empresa é rejeitado; escolha uma unidade válida no cabeçalho para recuperar a navegação.
2. Abra **Localizações**, crie uma seção (código alfanumérico de 1 a 10 caracteres, normalizado para maiúsculas) e adicione módulos, prateleiras e posições. Exemplo: `A` → `A-01` → `A-01-P1` → `A-01-P1-01`.
3. No módulo, use **Criar prateleiras e posições em lote**: até 20 prateleiras e 100 posições por prateleira na mesma operação. Todos os registros são criados em uma única transação.
4. Abra uma posição e aloque itens; ou abra um item e use a aba **Localizações**. Um item pode estar em várias posições e uma posição pode conter vários itens. As quantidades são registradas pelas movimentações da Fase 3.
5. Na localização, gere seu QR. Regenerar exige confirmação, incrementa a versão e invalida imediatamente o token antigo. Excluir o QR invalida suas etiquetas; gerar novamente restaura o cadastro com token novo.
6. Use **QR Codes** para selecionar até 200 etiquetas ativas da unidade atual. Escolha A4 (3×8, 24 etiquetas por página) ou térmica (uma etiqueta por página de 50×30 mm). Imprima em tamanho real/100%, sem ajuste automático. Fichas estão nos detalhes de seção, módulo e prateleira e exigem QR ativo.
7. Use **Escanear** para câmera traseira ou entrada manual. URLs de QR da origem configurada abrem `/q/<token>`; os demais conteúdos são consultados como códigos exatos de barras/internos. Nenhuma URL externa lida é usada como destino de navegação. Busca textual por nome fica na pesquisa global.

ADMIN e GERENTE alteram estrutura, alocações e QRs. ESTOQUISTA lê, escaneia e imprime. Códigos e pais são imutáveis após criação; edição altera os campos descritivos disponíveis no schema. Exclusão é lógica nos quatro níveis e no QR. Filhos ativos e alocações impedem exclusão. Excluir um item remove suas alocações na mesma transação, evitando posições bloqueadas por itens que já não podem ser lidos.

No desktop, a estrutura é uma árvore recolhível com contadores. No celular, a navegação avança por níveis. O QR de outra unidade da mesma empresa mostra o conteúdo com aviso e opção de trocar a unidade; alterações e navegação de estrutura ficam disponíveis após essa troca. Tokens inexistentes, excluídos ou de outra empresa retornam o mesmo 404. Login e seleção de empresa preservam o destino do QR.

### Testar no celular por HTTPS

Exponha o servidor local por um túnel HTTPS de desenvolvimento ou use um ambiente de homologação HTTPS. Configure a origem resultante em `NEXT_PUBLIC_APP_URL`, permita o domínio/origem na instância de desenvolvimento do Clerk e reinicie o servidor. Gere o QR com essa origem, abra pelo celular, autentique e selecione a empresa correta. Em `/escanear`, autorize a câmera. Acesso por IP da rede em HTTP geralmente não permite câmera; `localhost` é a exceção do navegador e se refere ao próprio aparelho.

Permissão negada, câmera ausente, contexto sem HTTPS e câmera em uso têm mensagens e alternativa manual. A câmera é encerrada ao parar, ler um resultado ou sair da tela. Não foi realizado teste físico em celular nesta implementação.

### Busca e endpoints

`GET /api/busca?q=...` mantém o grupo `itens` da empresa e acrescenta `localizacoes` da unidade atual, com até 20 resultados por grupo. Nos itens, a prioridade continua barras exato → interno exato → nome; nas localizações, código exato → nome. `exato=1` atende o scanner com apenas códigos exatos de itens. A UI mantém debounce de 300 ms.

Rotas autenticadas de leitura/impressão:

- `/q/[token]`: conteúdo do QR, com resolução restrita à empresa.
- `/api/qrcodes/[id]/imagem?formato=png` ou `svg`: imagem autorizada na unidade atual, sem cache.
- `/api/pdf/etiquetas?ids=id1,id2&formato=A4` ou `TERMICA`: lote autorizado por inteiro antes de gerar imagens.
- `/api/pdf/ficha/SECAO/[id]`, `/MODULO/[id]` e `/PRATELEIRA/[id]`: ficha com unidade, data, caminho, QR, estrutura e itens.

Todos os novos endpoints usam o contexto autenticado; os geradores PDF/imagem rodam em Node.js. Leituras não alteram a estrutura nem geram QR automaticamente.

### Seed, testes e amostras

O seed agora acrescenta, na primeira unidade ativa: 2 seções, 3 módulos por seção, 4 prateleiras por módulo, 6 posições por prateleira, QRs das seções/módulos e 20 alocações. Totais: 2 seções, 6 módulos, 24 prateleiras, 144 posições, 8 QRs e 20 alocações. Reexecutar não duplica cadastros nem troca tokens existentes.

```powershell
npm run typecheck
npm run test:postgres
npm run build
# Amostras visuais sem conexão com dados reais:
npx tsx scripts/gerar-amostras-pdf.tsx
```

A suíte completa tem 39 testes passando, incluindo 50 posições concorrentes no mesmo pai, rollback de lote após falha intermediária, isolamento entre empresas/unidades, cookie inválido, ciclo de QR, CHECK no PostgreSQL e geração autorizada de PDFs. A regressão de 1.000 itens paralelos da Fase 1 continua passando. O runner confere os seeds das duas fases em duas execuções.

As três amostras ficam em `output/pdf/`: A4 com 25 etiquetas em duas páginas, térmica com duas etiquetas de 50×30 mm e ficha de cinco páginas. Os QRs dessas amostras usam um domínio reservado de exemplo e servem somente para conferência visual. Os PDFs foram renderizados para revisão; o QR térmico foi decodificado a partir da renderização em 203 dpi. Impressora física e câmera em celular ainda precisam ser conferidas no ambiente de destino.

O projeto usa módulos ESM para compatibilidade com o renderer e inclui `@react-pdf/renderer`/`qrcode` em `serverExternalPackages`. Vitest transforma JSX explicitamente. Detalhes dos testes e limites estão em [VALIDACAO.md](VALIDACAO.md).

## Fase 3 — Estoque e movimentações

A migration `202611220001_fase3_estoque` adiciona saldos, movimentações, estornos, motivos de quebra e anexos. As alocações das fases anteriores continuam disponíveis. O saldo começa em zero até o primeiro lançamento.

```powershell
npm ci
npm run db:generate
npm run db:migrate
npm run db:seed        # opcional, para uma empresa de demonstração
npm run db:reconciliar # consulta somente leitura
npm run dev
```

- **Estoque** mostra o total de cada item na unidade atual. Expanda o item para ver as posições e o balde **Sem posição**. Use os filtros de categoria e saldo positivo.
- **Movimentações** permite filtrar o histórico por tipo, item, posição, usuário e datas. Abra **Nova movimentação** e avance por item, posições, quantidade e detalhes. Os atalhos na posição, no QR e na aba **Estoque** do item preenchem o contexto. Após salvar, **Lançar outro** conserva tipo e posições.
- No celular com HTTPS, use **Ler QR da posição** e **Ler código de barras**. Os dois seletores também aceitam busca ou digitação do código. Um QR de outra unidade exige trocar de unidade antes do lançamento.
- ADMIN, GERENTE e ESTOQUISTA lançam entradas, saídas, quebras e transferências dentro da unidade. ADMIN e GERENTE também lançam ajustes, estornam e administram motivos de quebra. Ajustes exigem uma justificativa de pelo menos 10 caracteres. Estornos exigem justificativa.
- Para estornar, abra o detalhe da movimentação e confirme com a justificativa. Se o débito inverso exceder o saldo do local, o detalhe da falha informa o saldo e a quantidade faltante.

### Fotos de avaria

Preencha as cinco variáveis opcionais do ImageKit em `.env.example` para habilitar o campo de fotos. A chave pública e o endpoint devem coincidir nas versões pública e de servidor. Configure uma origem HTTPS do ImageKit e reinicie o servidor após atualizar o ambiente. O formulário aceita até três fotos JPEG, PNG ou WebP com até 5 MB cada. As fotos são privadas na pasta `/avarias/<empresaId>` e o detalhe usa uma rota autenticada para exibi-las.

O seed cria sete motivos e 45 movimentações na primeira unidade ativa da empresa de demonstração, sendo 30 entradas, 10 saídas, três transferências e duas quebras. A reconciliação devolve a diferença por empresa, unidade, item e posição e termina com código 1 se encontrar divergências.

Execute `npm run typecheck` e `npm run test:postgres` para a suíte local. O runner aplica as migrations em um PostgreSQL temporário, executa o seed duas vezes, verifica a reconciliação e roda o Vitest.
