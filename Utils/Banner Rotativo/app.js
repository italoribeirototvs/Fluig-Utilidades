/**
 * Banner Management Application
 * @namespace BannerApp
 * @description Centraliza a lógica de controle, serviços de API e validações.
 * Autor: Italo Ribeiro
 */
var BannerApp = {
    
    /**
     * Services: Handles data operations and API calls
     */
    Services: {
        /**
         * Realiza o upload binário para o GED via API REST v2
         * @param {File} file - Objeto de arquivo original
         * @param {string} fileName - Novo nome para o arquivo (ex: BANNER_1.png)
         * @param {string} parentId - ID da pasta de destino
         * @returns {Promise}
         */
        fnPublishBanner: function(file, fileName, parentId) {
            var formData = new FormData();
            formData.append('file', file, fileName);

            var uploadUrl = "/content-management/api/v2/documents/upload/" + fileName + "/" + parentId + "/publish";

            return $.ajax({
                url: uploadUrl,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                headers: { 'accept': 'application/json' }
            });
        }
    },

    /**
     * Utils: Helper functions for validation and logic processing
     */
    Utils: {
        /**
         * Extrai a extensão do arquivo e valida o tipo permitido
         * @param {string} fileName 
         * @returns {string|null}
         */
        fnGetExtension: function(fileName) {
            var ext = fileName.split('.').pop().toLowerCase();
            return (['jpg', 'jpeg', 'png'].indexOf(ext) !== -1) ? ext : null;
        }
    },

    /**
     * Events: UI Interaction handlers
     */
    Events: {
        /**
         * Gerencia o evento de alteração no input file
         */
        fnOnUploadChange: function(element, slot) {
            var file = element.files[0];
            var parentId = $("#PARENT_ID").val();

            if (!file) return;
            if (!parentId) {
                FLUIGC.toast({ message: 'Informe o ID da Pasta de destino antes de fazer o upload.', type: 'warning' });
                $(element).val('');
                return;
            }

            var extension = BannerApp.Utils.fnGetExtension(file.name);
            if (!extension) {
                FLUIGC.toast({ title: 'Erro:', message: 'Apenas imagens JPG ou PNG.', type: 'danger' });
                $(element).val('');
                return;
            }

            var loading = FLUIGC.loading(window);
            loading.show();

            var newFileName = "BANNER_" + slot + "." + extension;

            BannerApp.Services.fnPublishBanner(file, newFileName, parentId)
                .done(function(response) {
                    var docId = response.documentId;
                    // Monta o endpoint de stream para o widget consumir
                    var streamUrl = window.location.origin + "/content-management/api/v2/documents/" + docId + "/stream";

                    $("#URLIMAGEM_" + slot).val(streamUrl);
                    $("#DOCID_" + slot).val(docId);
                    $("#ATIVO_" + slot).prop('checked', true);

                    FLUIGC.toast({ message: 'Upload slot ' + slot + ' concluído.', type: 'success' });
                })
                .fail(function() {
                    FLUIGC.toast({ message: 'Erro ao publicar banner no GED.', type: 'danger' });
                })
                .always(function() {
                    loading.hide();
                });
        },

        /**
         * Abre visualização em modal
         */
        fnOnPreviewClick: function(slot) {
            var url = $("#URLIMAGEM_" + slot).val();
            if (!url || url.indexOf('http') === -1) {
                FLUIGC.toast({ message: 'Nenhuma mídia carregada para este slot.', type: 'warning' });
                return;
            }

            FLUIGC.modal({
                title: 'Visualização do Slot ' + slot,
                content: '<div class="text-center"><img src="' + url + '" style="max-width:100%;"></div>',
                id: 'modal-preview',
                size: 'large',
                actions: [{ 'label': 'Fechar', 'autoClose': true }]
            });
        },

        /**
         * Valida preenchimento obrigatório ao ativar o banner
         */
        fnValidateSlot: function(slot) {
            var isActive = $("#ATIVO_" + slot).is(":checked");
            var hasUrl = $("#URLIMAGEM_" + slot).val().indexOf('http') !== -1;
            var hasLink = $("#LINK_" + slot).val().trim() !== "";

            if (isActive) {
                if (!hasUrl) {
                    FLUIGC.toast({ message: 'Atenção: O Slot ' + slot + ' está ativo mas não possui imagem.', type: 'warning' });
                }
                if (!hasLink) {
                    FLUIGC.toast({ message: 'Atenção: O Slot ' + slot + ' está ativo mas não possui Link de Destino.', type: 'warning' });
                }
            }
        }
    }
};

/**
 * Inicialização do formulário
 */
$(document).ready(function() {
    // Inicializações globais se necessário
});
