/**
 * Serviço de Moedas
 * Gerencia todas as operações com Firebase Realtime Database
 */
class MoedaService {
    constructor(database) {
        this.db = database; // Referência ao Firebase Realtime Database
        this.path = 'moedas'; // Caminho raiz para a coleção de moedas
        this.unsubscribe = null; // Armazena função para desinscrever do listener
    }

    /**
     * Inscreve-se a atualizações em tempo real de moedas (on 'value')
     * @param {Function} callback - Função chamada quando dados mudam (recebe array de moedas)
     * @param {Function} errorCallback - Função para tratar erros (opcional)
     * @returns {Function} Função para desinscrever do listener
     */
    subscribeToItems(callback, errorCallback = null) {
        try {
            // Usando on 'value' para atualizar em tempo real
            const ref = this.db.ref(this.path);
            // Armazenar a função listener para poder removê-la depois
            const listener = (snapshot) => {
                const data = snapshot.val();
                const moedas = [];

                if (data) {
                    // Converter objeto de dados em array de Items
                    for (const id in data) {
                        if (Object.prototype.hasOwnProperty.call(data, id)) {
                            const item = Item.fromFirebase(data[id], id);
                            moedas.push(item);
                        }
                    }
                }

                callback(moedas);
            };

            const errorHandler = (error) => {
                console.error('Erro ao inscrever-se a moedas:', error);
                if (errorCallback) {
                    errorCallback(new Error('Erro ao carregar coleção em tempo real: ' + error.message));
                }
            };

            ref.on('value', listener, errorHandler);
            this.unsubscribe = listener;

            // Retorna função para desinscrever
            return () => {
                const refOff = this.db.ref(this.path);
                if (this.unsubscribe) {
                    refOff.off('value', this.unsubscribe);
                } else {
                    refOff.off('value');
                }
            };
        } catch (error) {
            console.error('Erro ao configurar listener:', error);
            if (errorCallback) {
                errorCallback(error);
            }
            return () => {}; // Retorna função vazia se falhar
        }
    }

    /**
     * Busca todas as moedas do Firebase (Promise-based, mantido para compatibilidade)
     * @returns {Promise<Array<Item>>} Array de moedas
     */
    async fetchItems() {
        try {
            const ref = this.db.ref(this.path);
            // Usar once('value') para compatibilidade com Realtime Database compat
            const snapshot = await ref.once('value');
            const moedas = [];
            
            if (snapshot.exists()) {
                const data = snapshot.val();
                for (const id in data) {
                    if (data.hasOwnProperty(id)) {
                        const item = Item.fromFirebase(data[id], id);
                        moedas.push(item);
                    }
                }
            }
            
            return moedas;
        } catch (error) {
            console.error('Erro ao buscar moedas:', error);
            throw new Error('Erro ao carregar a coleção: ' + error.message);
        }
    }

    /**
     * Desinscreve do listener de tempo real
     */
    unsubscribeFromItems() {
        if (this.unsubscribe) {
            const ref = this.db.ref(this.path);
            ref.off('value', this.unsubscribe);
            this.unsubscribe = null;
        }
    }

    /**
     * Adiciona uma nova moeda ao Firebase Realtime Database
     * @param {Item} item - Objeto Item a ser adicionado
     * @returns {Promise<string>} ID da chave criada
     */
    async addItem(item) {
        try {
            if (!item.validar()) {
                throw new Error('Dados inválidos. Verifique todos os campos.');
            }

            const ref = this.db.ref(this.path).push();
            await ref.set(item.toFirebaseObject());
            return ref.key;
        } catch (error) {
            console.error('Erro ao adicionar moeda:', error);
            throw new Error('Erro ao adicionar moeda: ' + error.message);
        }
    }

    /**
     * Remove uma moeda do Firebase Realtime Database
     * @param {string} id - ID/chave do nó a remover
     * @returns {Promise<void>}
     */
    async removeItem(id) {
        try {
            const ref = this.db.ref(`${this.path}/${id}`);
            await ref.remove();
        } catch (error) {
            console.error('Erro ao remover moeda:', error);
            throw new Error('Erro ao remover moeda: ' + error.message);
        }
    }

    /**
     * Atualiza uma moeda existente no Firebase Realtime Database
     * @param {string} id - ID/chave do nó a atualizar
     * @param {Item} item - Objeto Item com dados atualizados
     * @returns {Promise<void>}
     */
    async updateItem(id, item) {
        try {
            if (!item.validar()) {
                throw new Error('Dados inválidos. Verifique todos os campos.');
            }

            const ref = this.db.ref(`${this.path}/${id}`);
            await ref.update(item.toFirebaseObject());
        } catch (error) {
            console.error('Erro ao atualizar moeda:', error);
            throw new Error('Erro ao atualizar moeda: ' + error.message);
        }
    }
}
