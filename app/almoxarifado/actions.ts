'use server'

import { redirect } from 'next/navigation'
import { createTenantClient as createClient } from '@/lib/supabase/tenant-server'
import { getUsuarioAdministrativoAtual } from '@/lib/usuario-atual'

export type AlmoxarifadoCategoria = {
  id: string
  nome: string
  descricao: string | null
  created_at: string
}

export type AlmoxarifadoProduto = {
  id: string
  nome: string
  categoria_id: string
  unidade: string
  quantidade_atual: number
  quantidade_minima: number
  ativo: boolean
  created_at: string
  categorias?: { id: string; nome: string } | { id: string; nome: string }[] | null
}

export type AlmoxarifadoMovimentacao = {
  id: string
  produto_id: string
  tipo: 'entrada' | 'saida' | 'ajuste'
  quantidade: number
  destino: 'setor' | 'evento' | 'aula' | 'banda' | 'turismo' | null
  centro_custo: string | null
  responsavel_solicitacao: string | null
  observacao: string | null
  usuario_id: string | null
  created_at: string
  almoxarifado_produtos?: { id: string; nome: string; unidade: string } | { id: string; nome: string; unidade: string }[] | null
  administrativo_usuarios?: { nome: string | null; email: string | null } | { nome: string | null; email: string | null }[] | null
}

export type RelatoriosAlmoxarifado = {
  periodo: {
    dataInicio: string
    dataFim: string
  }
  consumoPorPeriodo: Array<{
    data: string
    quantidade: number
  }>
  produtosMaisUtilizados: Array<{
    produtoId: string
    produto: string
    unidade: string
    quantidade: number
  }>
  consumoPorDestino: Array<{
    destino: string
    quantidade: number
  }>
  consumoPorCentroCusto: Array<{
    centroCusto: string
    quantidade: number
  }>
  itensAbaixoMinimo: AlmoxarifadoProduto[]
}

function normalizarTexto(valor: FormDataEntryValue | null) {
  return String(valor ?? '').trim()
}

function normalizarNumero(valor: FormDataEntryValue | null) {
  const texto = normalizarTexto(valor).replace(',', '.')
  if (!texto) return 0

  const numero = Number(texto)
  return Number.isFinite(numero) ? numero : null
}

function destinoComMensagem(destino: string, mensagem: string): never {
  const separador = destino.includes('?') ? '&' : '?'
  redirect(`${destino}${separador}message=${encodeURIComponent(mensagem)}`)
}

function mensagemErroDuplicidade(error: { code?: string; message?: string } | null, fallback: string) {
  if (error?.code === '23505') return fallback
  return error?.message || fallback
}

function hojeBrasil() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function inicioMesAtual() {
  return `${hojeBrasil().slice(0, 8)}01`
}

function somarEmMapa(mapa: Map<string, number>, chave: string, valor: number) {
  mapa.set(chave, (mapa.get(chave) ?? 0) + valor)
}

export async function listarCategorias() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('almoxarifado_categorias')
    .select('id, nome, descricao, created_at')
    .order('nome', { ascending: true })

  if (error) throw new Error(error.message)

  return (data ?? []) as AlmoxarifadoCategoria[]
}

export async function listarProdutos(filtros?: {
  busca?: string
  categoriaId?: string
  estoque?: string
  ativos?: boolean
}) {
  const supabase = await createClient()

  let query = supabase
    .from('almoxarifado_produtos')
    .select(`
      id,
      nome,
      categoria_id,
      unidade,
      quantidade_atual,
      quantidade_minima,
      ativo,
      created_at,
      categorias:almoxarifado_categorias!almoxarifado_produtos_categoria_id_fkey (
        id,
        nome
      )
    `)
    .order('nome', { ascending: true })

  if (filtros?.busca) {
    query = query.ilike('nome', `%${filtros.busca}%`)
  }

  if (filtros?.categoriaId) {
    query = query.eq('categoria_id', filtros.categoriaId)
  }

  if (filtros?.ativos !== false) {
    query = query.eq('ativo', true)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)

  let produtos = (data ?? []) as unknown as AlmoxarifadoProduto[]

  if (filtros?.estoque === 'baixo') {
    produtos = produtos.filter(
      (produto) => Number(produto.quantidade_atual) <= Number(produto.quantidade_minima)
    )
  }

  return produtos
}

export async function listarMovimentacoes(filtros?: {
  produtoId?: string
  destino?: string
  dataInicio?: string
  dataFim?: string
  limite?: number
}) {
  const supabase = await createClient()

  let query = supabase
    .from('almoxarifado_movimentacoes')
    .select(`
      id,
      produto_id,
      tipo,
      quantidade,
      destino,
      centro_custo,
      responsavel_solicitacao,
      observacao,
      usuario_id,
      created_at,
      almoxarifado_produtos:almoxarifado_produtos!almoxarifado_movimentacoes_produto_id_fkey (
        id,
        nome,
        unidade
      ),
      administrativo_usuarios:administrativo_usuarios!almoxarifado_movimentacoes_usuario_id_fkey (
        nome,
        email
      )
    `)
    .order('created_at', { ascending: false })

  if (filtros?.produtoId) {
    query = query.eq('produto_id', filtros.produtoId)
  }

  if (filtros?.destino) {
    query = query.eq('destino', filtros.destino)
  }

  if (filtros?.dataInicio) {
    query = query.gte('created_at', `${filtros.dataInicio}T00:00:00`)
  }

  if (filtros?.dataFim) {
    query = query.lte('created_at', `${filtros.dataFim}T23:59:59`)
  }

  if (filtros?.limite) {
    query = query.limit(filtros.limite)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)

  return (data ?? []) as unknown as AlmoxarifadoMovimentacao[]
}

export async function getRelatoriosAlmoxarifado(filtros?: {
  dataInicio?: string
  dataFim?: string
}): Promise<RelatoriosAlmoxarifado> {
  const dataInicio = filtros?.dataInicio || inicioMesAtual()
  const dataFim = filtros?.dataFim || hojeBrasil()

  const [movimentacoes, itensAbaixoMinimo] = await Promise.all([
    listarMovimentacoes({ dataInicio, dataFim }),
    listarProdutos({ estoque: 'baixo', ativos: true }),
  ])

  const saidas = movimentacoes.filter((movimentacao) => movimentacao.tipo === 'saida')
  const consumoPorData = new Map<string, number>()
  const consumoPorProduto = new Map<string, {
    produtoId: string
    produto: string
    unidade: string
    quantidade: number
  }>()
  const consumoPorDestino = new Map<string, number>()
  const consumoPorCentroCusto = new Map<string, number>()

  for (const movimentacao of saidas) {
    const data = movimentacao.created_at.slice(0, 10)
    const quantidade = Math.abs(Number(movimentacao.quantidade ?? 0))
    const produtoRelacao = Array.isArray(movimentacao.almoxarifado_produtos)
      ? movimentacao.almoxarifado_produtos[0]
      : movimentacao.almoxarifado_produtos
    const produtoId = movimentacao.produto_id
    const produtoAtual = consumoPorProduto.get(produtoId)

    somarEmMapa(consumoPorData, data, quantidade)
    somarEmMapa(consumoPorDestino, movimentacao.destino || 'Sem destino', quantidade)
    somarEmMapa(consumoPorCentroCusto, movimentacao.centro_custo || 'Sem centro de custo', quantidade)

    consumoPorProduto.set(produtoId, {
      produtoId,
      produto: produtoRelacao?.nome || 'Produto não identificado',
      unidade: produtoRelacao?.unidade || '',
      quantidade: (produtoAtual?.quantidade ?? 0) + quantidade,
    })
  }

  return {
    periodo: {
      dataInicio,
      dataFim,
    },
    consumoPorPeriodo: Array.from(consumoPorData.entries())
      .map(([data, quantidade]) => ({ data, quantidade }))
      .sort((a, b) => a.data.localeCompare(b.data)),
    produtosMaisUtilizados: Array.from(consumoPorProduto.values())
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10),
    consumoPorDestino: Array.from(consumoPorDestino.entries())
      .map(([destino, quantidade]) => ({ destino, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade),
    consumoPorCentroCusto: Array.from(consumoPorCentroCusto.entries())
      .map(([centroCusto, quantidade]) => ({ centroCusto, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade),
    itensAbaixoMinimo,
  }
}

export async function criarCategoria(formData: FormData) {
  const supabase = await createClient()
  const nome = normalizarTexto(formData.get('nome'))
  const descricao = normalizarTexto(formData.get('descricao'))

  if (!nome) {
    destinoComMensagem('/almoxarifado/categorias', 'Informe o nome da categoria')
  }

  const { error } = await supabase.from('almoxarifado_categorias').insert({
    nome,
    descricao: descricao || null,
  })

  if (error) {
    destinoComMensagem(
      '/almoxarifado/categorias',
      mensagemErroDuplicidade(error, 'Já existe uma categoria com este nome')
    )
  }

  redirect('/almoxarifado/categorias?message=Categoria cadastrada com sucesso')
}

export async function criarProduto(formData: FormData) {
  const supabase = await createClient()
  const nome = normalizarTexto(formData.get('nome'))
  const categoriaId = normalizarTexto(formData.get('categoria_id'))
  const unidade = normalizarTexto(formData.get('unidade'))
  const quantidadeAtual = normalizarNumero(formData.get('quantidade_atual'))
  const quantidadeMinima = normalizarNumero(formData.get('quantidade_minima'))

  if (!nome || !categoriaId || !unidade) {
    destinoComMensagem('/almoxarifado/produtos?novo=1', 'Preencha nome, categoria e unidade')
  }

  if (quantidadeAtual === null || quantidadeAtual < 0) {
    destinoComMensagem('/almoxarifado/produtos?novo=1', 'Quantidade atual inválida')
  }

  if (quantidadeMinima === null || quantidadeMinima < 0) {
    destinoComMensagem('/almoxarifado/produtos?novo=1', 'Quantidade mínima inválida')
  }

  const { error } = await supabase.from('almoxarifado_produtos').insert({
    nome,
    categoria_id: categoriaId,
    unidade,
    quantidade_atual: quantidadeAtual,
    quantidade_minima: quantidadeMinima,
    ativo: true,
  })

  if (error) {
    destinoComMensagem(
      '/almoxarifado/produtos?novo=1',
      mensagemErroDuplicidade(error, 'Já existe um produto com este nome')
    )
  }

  redirect('/almoxarifado/produtos?message=Produto cadastrado com sucesso')
}

export async function registrarMovimentacao(formData: FormData) {
  const supabase = await createClient()
  const produtoId = normalizarTexto(formData.get('produto_id'))
  const tipo = normalizarTexto(formData.get('tipo')) as 'entrada' | 'saida' | 'ajuste'
  const quantidade = normalizarNumero(formData.get('quantidade'))
  const destino = normalizarTexto(formData.get('destino'))
  const centroCusto = normalizarTexto(formData.get('centro_custo'))
  const responsavelSolicitacao = normalizarTexto(formData.get('responsavel_solicitacao'))
  const observacao = normalizarTexto(formData.get('observacao'))

  if (!produtoId) {
    destinoComMensagem('/almoxarifado/movimentacoes', 'Selecione o produto')
  }

  if (!['entrada', 'saida', 'ajuste'].includes(tipo)) {
    destinoComMensagem('/almoxarifado/movimentacoes', 'Tipo de movimentação inválido')
  }

  if (quantidade === null || quantidade === 0) {
    destinoComMensagem('/almoxarifado/movimentacoes', 'Informe uma quantidade válida')
  }

  if ((tipo === 'entrada' || tipo === 'saida') && quantidade <= 0) {
    destinoComMensagem('/almoxarifado/movimentacoes', 'Entrada e saída exigem quantidade positiva')
  }

  if (destino && !['setor', 'evento', 'aula', 'banda', 'turismo'].includes(destino)) {
    destinoComMensagem('/almoxarifado/movimentacoes', 'Destino inválido')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const usuario = await getUsuarioAdministrativoAtual(user)

  const { data: produto, error: produtoError } = await supabase
    .from('almoxarifado_produtos')
    .select('id, quantidade_atual, ativo')
    .eq('id', produtoId)
    .maybeSingle()

  if (produtoError) {
    destinoComMensagem('/almoxarifado/movimentacoes', produtoError.message)
  }

  if (!produto || !produto.ativo) {
    destinoComMensagem('/almoxarifado/movimentacoes', 'Produto não encontrado ou inativo')
  }

  const delta = tipo === 'entrada'
    ? quantidade
    : tipo === 'saida'
      ? -Math.abs(quantidade)
      : quantidade

  if (Number(produto.quantidade_atual) + delta < 0) {
    destinoComMensagem('/almoxarifado/movimentacoes', 'Movimentação inválida: estoque não pode ficar negativo')
  }

  const { error } = await supabase.from('almoxarifado_movimentacoes').insert({
    produto_id: produtoId,
    tipo,
    quantidade,
    destino: destino || null,
    centro_custo: centroCusto || null,
    responsavel_solicitacao: responsavelSolicitacao || null,
    observacao: observacao || null,
    usuario_id: usuario?.id ?? null,
  })

  if (error) {
    destinoComMensagem('/almoxarifado/movimentacoes', error.message)
  }

  redirect('/almoxarifado/movimentacoes?message=Movimentação registrada com sucesso')
}
