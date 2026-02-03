/**
 * BannerRotator - Módulo Modular para Renderização de Banners Fluig
 * @namespace BannerRotator
 * @description Gerencia a busca de dados, filtragem por validade e renderização do carrossel.
 */
var BannerRotator = (function() {

    /**
     * Estado interno do componente
     */
    var _state = {
        currentIndex: 0,
        timer: null,
        data: []
    };

    /**
     * API e Serviços de Dataset
     */
    var Services = {
        /**
         * Busca configurações no Dataset ds_frm_banner com logs de inspeção
         * @param {string} widgetIdentifier - ID único definido no formulário
         */
        fnFetchDataset: function(widgetIdentifier) {
            console.log("--- BANNER DEBUG: INICIANDO BUSCA ---");
            console.log("Identificador solicitado: '" + widgetIdentifier + "'");

            return new Promise(function(resolve, reject) {
                // Constraint 1: Filtro pelo Identificador do Widget
                var c1 = DatasetFactory.createConstraint("WIDGET_ID", widgetIdentifier, widgetIdentifier, ConstraintType.MUST);
                
                // Constraint 2: Apenas registros ativos (ignora versões antigas/deletadas)
                // Usamos string "true" pois o Fluig trata metadados como texto no banco
                var c2 = DatasetFactory.createConstraint("metadata#active", "true", "true", ConstraintType.MUST);
                
                var constraints = [c1, c2];

                console.log("Constraints aplicadas:", constraints);

                DatasetFactory.getDataset("ds_frm_banner", null, constraints, null, {
                    success: function(dataset) {
                        console.log("--- BANNER DEBUG: SUCESSO NA RESPOSTA ---");
                        console.log("Objeto Dataset retornado:", dataset);

                        if (dataset && dataset.values && dataset.values.length > 0) {
                            var config = dataset.values[0];
                            
                            // LOG CRUCIAL: Verifique aqui os nomes das chaves (ATIVO_1, URLIMAGEM_1, etc)
                            console.log("JSON da primeira linha (RAW DATA):", JSON.stringify(config, null, 2));
                            console.log("Colunas mapeadas no objeto:", Object.keys(config));
                            
                            resolve(config);
                        } else {
                            console.error("--- BANNER DEBUG: NENHUM REGISTRO ENCONTRADO ---");
                            console.warn("Dica: O WIDGET_ID '" + widgetIdentifier + "' existe no dataset ds_frm_banner? A ficha está ativa?");
                            reject("Configuração não encontrada para: " + widgetIdentifier);
                        }
                    },
                    error: function(err) { 
                        console.error("--- BANNER DEBUG: ERRO NA CHAMADA AJAX ---", err);
                        reject(err); 
                    }
                });
            });
        }
    };

    /**
     * Utilitários de lógica e data
     */
    var Utils = {
        /**
         * Verifica expiração (Suporta formato DD/MM/AAAA ou YYYY-MM-DD)
         */
        fnIsExpired: function(dateString) {
            if (!dateString || dateString.trim() === "" || dateString === "dd/mm/aaaa") return false;

            try {
                var today = new Date();
                today.setHours(0, 0, 0, 0);

                var expirationDate;
                
                // Trata formato brasileiro DD/MM/YYYY comum em calendários Fluig
                if (dateString.indexOf('/') !== -1) {
                    var parts = dateString.split('/');
                    expirationDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                } else {
                    expirationDate = new Date(dateString);
                }

                expirationDate.setHours(23, 59, 59, 999);
                var expired = expirationDate < today;
                
                if (expired) console.log("Banner Log: Slot ignorado por expiração em " + dateString);
                return expired;
            } catch (e) {
                console.warn("Banner Log: Erro ao converter data '" + dateString + "'");
                return false;
            }
        }
    };

    /**
     * Componentes de Visualização (HTML/CSS)
     */
    var View = {
        fnBuildHTML: function(containerId, banners) {
            var $target = $("#" + containerId);
            
            var style = 
                '<style>' +
                '#' + containerId + ' { position: relative; overflow: hidden; width: 100%; aspect-ratio: 21/9; border-radius: 8px; background: #000; }' +
                '.br-wrapper { display: flex; transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); height: 100%; width: 100%; }' +
                '.br-item { min-width: 100%; height: 100%; flex-shrink: 0; }' +
                '.br-item img { width: 100%; height: 100%; object-fit: cover; display: block; border: none; }' +
                '.br-dots { position: absolute; bottom: 12px; width: 100%; display: flex; justify-content: center; gap: 6px; z-index: 5; }' +
                '.br-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.4); border: none; padding: 0; cursor: pointer; transition: 0.3s; }' +
                '.br-dot.active { background: #fff; width: 24px; border-radius: 4px; }' +
                '</style>';

            var html = style + '<div class="br-wrapper">';
            
            banners.forEach(function(b) {
                html += '<div class="br-item">';
                var hasLink = b.link && b.link.trim() !== "" && b.link !== "#";
                if (hasLink) html += '<a href="' + b.link + '" target="_blank">';
                html += '<img src="' + b.url + '" alt="' + (b.alt || "") + '">';
                if (hasLink) html += '</a>';
                html += '</div>';
            });

            html += '</div><div class="br-dots"></div>';
            $target.html(html);

            var dotsHtml = '';
            banners.forEach(function(_, i) {
                dotsHtml += '<button class="br-dot" data-index="' + i + '"></button>';
            });
            $target.find('.br-dots').html(dotsHtml);
        }
    };

    return {
        /**
         * Inicialização do Componente
         */
        fnInit: function(containerId, widgetIdentifier) {
            Services.fnFetchDataset(widgetIdentifier)
                .then(function(config) {
                    var banners = [];
                    console.log("--- BANNER DEBUG: PROCESSANDO FILTROS ---");

                    // Loop pelos 4 slots do formulário
                    for (var i = 1; i <= 4; i++) {
                        var active = config["ATIVO_" + i] === "Sim";
                        var url = config["URLIMAGEM_" + i];
                        var validade = config["VALIDADE_" + i];
                        var expired = Utils.fnIsExpired(validade);

                        console.log("Slot " + i + ": Ativo=" + active + ", URL=" + (url ? "OK" : "Vazio") + ", Expirado=" + expired);

                        if (active && url && url.trim() !== "" && !expired) {
                            banners.push({
                                url: url,
                                link: config["LINK_" + i],
                                alt: config["ALT_" + i],
                                tempo: (parseInt(config["TEMPO_" + i]) || 5) * 1000
                            });
                        }
                    }

                    if (banners.length === 0) {
                        console.warn("Banner Log: Nenhum banner passou nos critérios de exibição.");
                        $("#" + containerId).html('<div class="alert alert-info" style="margin:0;">Nenhum banner ativo para "' + widgetIdentifier + '".</div>');
                        return;
                    }

                    _state.data = banners;
                    View.fnBuildHTML(containerId, banners);
                    this.fnStartRotation(containerId);

                }.bind(this))
                .catch(function(err) {
                    console.error("BannerRotator Catch:", err);
                    $("#" + containerId).html('<div class="alert alert-warning" style="margin:0;">Erro: ' + err + '</div>');
                });
        },

        /**
         * Gerencia a animação e tempos
         */
        fnStartRotation: function(containerId) {
            var $wrapper = $("#" + containerId).find(".br-wrapper");
            var $dots = $("#" + containerId).find(".br-dot");
            
            var fnUpdate = function(idx) {
                _state.currentIndex = idx;
                $wrapper.css("transform", "translateX(-" + (idx * 100) + "%)");
                $dots.removeClass("active").eq(idx).addClass("active");
            };

            var fnCycle = function() {
                var next = (_state.currentIndex + 1) % _state.data.length;
                fnUpdate(next);
                clearInterval(_state.timer);
                _state.timer = setInterval(fnCycle, _state.data[next].tempo);
            };

            fnUpdate(0);
            _state.timer = setInterval(fnCycle, _state.data[0].tempo);

            $dots.on("click", function() {
                clearInterval(_state.timer);
                var idx = $(this).data("index");
                fnUpdate(idx);
                _state.timer = setInterval(fnCycle, _state.data[idx].tempo);
            });
        }
    };
})();
