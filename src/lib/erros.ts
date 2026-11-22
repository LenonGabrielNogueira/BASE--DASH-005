export class AppError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export class NaoEncontrado extends AppError {
  constructor(message = "Registro não encontrado.") {
    super(message, 404);
  }
}
export class SemPermissao extends AppError {
  constructor(message = "Você não tem permissão para esta ação.") {
    super(message, 403);
  }
}
export class ConflitoDeDados extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}
export function mensagemErro(e: unknown): string {
  if (e instanceof AppError) return e.message;
  if (e && typeof e === "object" && "code" in e && e.code === "P2002")
    return "Já existe um cadastro com esses dados nesta empresa.";
  console.error(
    "Falha interna:",
    e instanceof Error ? e.name : "Erro desconhecido",
  );
  return "Não foi possível concluir. Tente novamente.";
}
