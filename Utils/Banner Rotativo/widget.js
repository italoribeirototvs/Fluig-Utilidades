/**
 * Portal Cliente - Controlador da Widget
 * @author Especialista Fluig Italo Ribeiro
 */
var Widget = SuperWidget.extend({
    
    instanceId: null,

    init: function() {
        this.instanceId = this.instanceId;
        var containerId = "banner-wrapper-" + this.instanceId;
        
        // Loader visual para feedback
        $(this.DOM).html('<div id="' + containerId + '" style="height:300px; display:flex; align-items:center; justify-content:center; background:#f9f9f9; border-radius:8px;">' +
                         '  <i class="fluigicon fluigicon-loader fluigicon-is-animated icon-md"></i>' +
                         '</div>');

        /**
         * ATENÇÃO: Verifique se no formulário o campo "Identificador no Widget"
         * está exatamente igual a este valor (incluindo espaços e maiúsculas/minúsculas).
         * Se no print estava "banner-home", garantimos que aqui também esteja.
         */
        var widgetIdentifier = "banner-home".trim(); 
        
        this.fnInitializeBanner(containerId, widgetIdentifier);
    },

    bindings: {
        local: { 'execute': ['click_executeAction'] },
        global: {}
    },

    /**
     * Inicializa o banner e trata possíveis erros de configuração ou carregamento
     */
    fnInitializeBanner: function(containerId, identifier) {
        console.log("Banner Log: Tentando inicializar identificador: '" + identifier + "'");

        if (typeof BannerRotator !== 'undefined') {
            // Chama o módulo externo modularizado
            BannerRotator.fnInit(containerId, identifier);
        } else {
            console.error("Banner Log ERRO: Objeto 'BannerRotator' não encontrado no escopo global.");
            this.fnShowErrorMessage(containerId, "Módulo de banner (banner_module.js) não foi carregado corretamente na página.");
        }
    },

    /**
     * Exibe mensagem de erro amigável na área do banner
     */
    fnShowErrorMessage: function(containerId, message) {
        $("#" + containerId).html(
            '<div class="alert alert-warning" style="margin:10px">' +
            '  <i class="fluigicon fluigicon-exclamation-sign"></i> ' +
            '  <strong>Atenção:</strong> ' + message + 
            '  <br><small>Verifique o console (F12) para detalhes técnicos.</small>' +
            '</div>'
        );
    },

    /**
     * Exemplo de função disparada por evento de clique
     */
    executeAction: function(htmlElement, event) {
        FLUIGC.toast({
            title: 'Widget Action: ',
            message: 'Ação executada na instância ' + this.instanceId,
            type: 'info'
        });
    }
});
