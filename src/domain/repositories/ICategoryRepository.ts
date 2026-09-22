import type { Category, CreateCategoryDTO } from '../models/categories'

export interface ICategoryRepository {
  /**
   * Retorna todas as categorias disponíveis para o usuário
   * (mesclando categorias padrão pré-definidas com as customizadas do usuário).
   */
  getAll(): Promise<Category[]>

  /**
   * Cria uma nova categoria personalizada vinculada ao usuário autenticado.
   */
  create(category: CreateCategoryDTO): Promise<Category>

  /**
   * Exclui uma categoria personalizada pelo ID.
   */
  delete(id: string): Promise<void>
}
