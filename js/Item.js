/**
 * Classe Item
 * Representa uma moeda da galeria com todos os campos obrigatórios
 */
class Item {
    constructor(titulo, descricao, categoria, imagem, gramatura, fabricacao, id = null) {
        this.id = id; // Gerado pelo Firebase
        this.titulo = titulo;
        this.descricao = descricao;
        this.categoria = categoria;
        this.imagem = imagem;
        this.gramatura = parseFloat(gramatura);
        this.fabricacao = parseInt(fabricacao);
        this.dataCriacao = new Date().toISOString();
    }

    /**
     * Valida os dados da moeda
     * @returns {boolean} true se válido
     */
    validar() {
        return this.titulo && this.descricao && this.categoria && 
               this.imagem && this.gramatura >= 0 && this.fabricacao >= 0;
    }

    /**
     * Converte o objeto para um formato seguro para salvar no Firebase
     * @returns {Object}
     */
    toFirebaseObject() {
        return {
            titulo: this.titulo,
            descricao: this.descricao,
            categoria: this.categoria,
            imagem: this.imagem,
            gramatura: this.gramatura,
            fabricacao: this.fabricacao,
            dataCriacao: this.dataCriacao
        };
    }

    /**
     * Cria uma instância de Item a partir de dados do Firebase Realtime Database
     * @param {Object} data - Dados do nó no Realtime Database
     * @param {string} id - ID/chave do nó
     * @returns {Item}
     */
    static fromFirebase(data, id) {
        const item = new Item(
            data.titulo,
            data.descricao,
            data.categoria,
            data.imagem,
            data.gramatura,
            data.fabricacao,
            id
        );
        item.dataCriacao = data.dataCriacao || item.dataCriacao;
        return item;
    }
}
